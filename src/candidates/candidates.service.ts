import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { CandidateJobStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { JobsService } from '../jobs/jobs.service';
import { BulkResumeItemDto } from './dto/bulk-upload.dto';
import { RESUME_PARSE_QUEUE, ResumeParseJobData } from './candidates.constants';

@Injectable()
export class CandidatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly jobs: JobsService,
    private readonly audit: AuditService,
    @InjectQueue(RESUME_PARSE_QUEUE) private readonly parseQueue: Queue,
  ) {}

  async getProfileAudited(
    companyId: string,
    candidateId: string,
    actorId: string,
  ) {
    const profile = await this.getProfile(companyId, candidateId);
    await this.audit.log({
      companyId,
      actorId,
      action: AuditAction.VIEW,
      resourceType: 'candidate',
      resourceId: candidateId,
    });
    return profile;
  }

  listForJob(companyId: string, jobId: string) {
    return this.prisma.candidateJob.findMany({
      where: { companyId, jobId, deletedAt: null },
      include: {
        candidate: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            tags: true,
          },
        },
      },
      orderBy: { fitScore: 'desc' },
    });
  }

  async getProfile(companyId: string, candidateId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, companyId, deletedAt: null },
      include: {
        resumes: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        candidateJobs: {
          where: { deletedAt: null },
          include: { job: { select: { id: true, title: true } } },
        },
      },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    return candidate;
  }

  async bulkPresign(
    companyId: string,
    jobId: string,
    files: BulkResumeItemDto[],
  ) {
    await this.jobs.get(companyId, jobId);
    const uploads = [];

    for (const file of files) {
      const dedupeEmail = file.email?.toLowerCase();
      let candidate = await this.findExistingCandidate(
        companyId,
        dedupeEmail,
        file.phone,
      );

      if (!candidate) {
        candidate = await this.prisma.candidate.create({
          data: {
            companyId,
            email: dedupeEmail,
            phone: file.phone,
            firstName: file.firstName,
            lastName: file.lastName,
          },
        });
      }

      await this.prisma.candidateJob.upsert({
        where: {
          candidateId_jobId: { candidateId: candidate.id, jobId },
        },
        create: {
          companyId,
          candidateId: candidate.id,
          jobId,
          status: CandidateJobStatus.PARSING,
        },
        update: { status: CandidateJobStatus.PARSING },
      });

      const key = this.storage.resumeKey(companyId, file.fileName);
      const presigned = await this.storage.presignedPut(key, file.contentType);
      const resume = await this.prisma.resume.create({
        data: {
          companyId,
          candidateId: candidate.id,
          storageKey: key,
          fileName: file.fileName,
          mimeType: file.contentType,
          parseStatus: 'queued',
        },
      });

      uploads.push({
        candidateId: candidate.id,
        resumeId: resume.id,
        ...presigned,
      });
    }

    return { uploads };
  }

  async confirmBulkUpload(
    companyId: string,
    jobId: string,
    resumeIds: string[],
  ) {
    await this.jobs.get(companyId, jobId);
    const enqueued: string[] = [];

    for (const resumeId of resumeIds) {
      const resume = await this.prisma.resume.findFirst({
        where: { id: resumeId, companyId, deletedAt: null },
      });
      if (!resume) {
        continue;
      }
      const data: ResumeParseJobData = {
        companyId,
        jobId,
        candidateId: resume.candidateId,
        resumeId: resume.id,
        storageKey: resume.storageKey,
      };
      await this.parseQueue.add('parse', data, {
        removeOnComplete: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
      enqueued.push(resumeId);
    }

    return { enqueued };
  }

  /** Sourcing agent: attach parsed text without S3 (Naukri/LinkedIn stub). */
  async createFromTextResume(
    companyId: string,
    input: {
      jobId: string;
      fileName: string;
      resumeText: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    },
  ) {
    await this.jobs.get(companyId, input.jobId);
    const dedupeEmail = input.email?.toLowerCase();
    let candidate = await this.findExistingCandidate(companyId, dedupeEmail, input.phone);
    if (!candidate) {
      candidate = await this.prisma.candidate.create({
        data: {
          companyId,
          email: dedupeEmail,
          phone: input.phone,
          firstName: input.firstName,
          lastName: input.lastName,
        },
      });
    }

    await this.prisma.candidateJob.upsert({
      where: { candidateId_jobId: { candidateId: candidate.id, jobId: input.jobId } },
      create: {
        companyId,
        candidateId: candidate.id,
        jobId: input.jobId,
        status: CandidateJobStatus.PARSED,
      },
      update: { status: CandidateJobStatus.PARSED },
    });

    const key = this.storage.resumeKey(companyId, `sourcing-${Date.now()}-${input.fileName}`);
    const resume = await this.prisma.resume.create({
      data: {
        companyId,
        candidateId: candidate.id,
        storageKey: key,
        fileName: input.fileName,
        mimeType: 'text/plain',
        parseStatus: 'parsed',
        parsedText: input.resumeText,
      },
    });

    return { candidateId: candidate.id, resumeId: resume.id };
  }

  async updateTags(companyId: string, candidateId: string, tags: string[]) {
    await this.getProfile(companyId, candidateId);
    return this.prisma.candidate.update({
      where: { id: candidateId },
      data: { tags },
    });
  }

  async updateNotes(companyId: string, candidateId: string, notes: string) {
    await this.getProfile(companyId, candidateId);
    return this.prisma.candidate.update({
      where: { id: candidateId },
      data: { notes },
    });
  }

  private findExistingCandidate(
    companyId: string,
    email?: string,
    phone?: string,
  ) {
    if (!email && !phone) {
      return null;
    }
    return this.prisma.candidate.findFirst({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });
  }
}

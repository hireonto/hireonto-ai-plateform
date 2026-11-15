import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { PRIVACY_QUEUE, RetentionJobData } from './privacy.constants';

@Injectable()
export class PrivacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @InjectQueue(PRIVACY_QUEUE) private readonly queue: Queue<RetentionJobData>,
  ) {}

  scheduleRetention(companyId: string, recordingRetentionDays: number) {
    return this.queue.add(
      'retention',
      { companyId, recordingRetentionDays },
      { repeat: { every: 24 * 3600 * 1000 } },
    );
  }

  async exportCandidate(companyId: string, candidateId: string, actorId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, companyId, deletedAt: null },
      include: {
        resumes: true,
        candidateJobs: true,
        interviews: {
          include: {
            questions: { include: { answers: true } },
            evaluationReport: true,
            integrityReport: true,
          },
        },
      },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    await this.audit.log({
      companyId,
      actorId,
      action: AuditAction.EXPORT,
      resourceType: 'candidate',
      resourceId: candidateId,
    });
    return candidate;
  }

  async deleteCandidate(companyId: string, candidateId: string, actorId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, companyId, deletedAt: null },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    const now = new Date();
    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { deletedAt: now, email: null, phone: null },
    });
    await this.audit.log({
      companyId,
      actorId,
      action: AuditAction.DELETE,
      resourceType: 'candidate',
      resourceId: candidateId,
    });
    return { deleted: true };
  }
}

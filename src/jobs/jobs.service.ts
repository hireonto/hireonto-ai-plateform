import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateJobDto, JobInterviewConfigDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  list(companyId: string) {
    return this.prisma.job.findMany({
      where: { companyId, deletedAt: null },
      include: { interviewConfig: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(companyId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId, deletedAt: null },
      include: {
        interviewConfig: true,
        questionBanks: { where: { deletedAt: null } },
      },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  create(companyId: string, dto: CreateJobDto, createdById?: string) {
    return this.prisma.job.create({
      data: {
        companyId,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        autoShortlistThreshold: dto.autoShortlistThreshold,
        createdById,
        interviewConfig: {
          create: {},
        },
      },
      include: { interviewConfig: true },
    });
  }

  async update(companyId: string, jobId: string, dto: UpdateJobDto) {
    await this.get(companyId, jobId);
    return this.prisma.job.update({
      where: { id: jobId },
      data: dto,
      include: { interviewConfig: true },
    });
  }

  async upsertInterviewConfig(
    companyId: string,
    jobId: string,
    dto: JobInterviewConfigDto,
  ) {
    await this.get(companyId, jobId);
    return this.prisma.jobInterviewConfig.upsert({
      where: { jobId },
      create: { jobId, ...dto },
      update: dto,
    });
  }

  async presignJd(companyId: string, jobId: string, fileName: string, contentType: string) {
    await this.get(companyId, jobId);
    const key = this.storage.jdKey(companyId, jobId, fileName);
    const presigned = await this.storage.presignedPut(key, contentType);
    await this.prisma.job.update({
      where: { id: jobId },
      data: { jdStorageKey: key },
    });
    return presigned;
  }

  async presignQuestionBank(
    companyId: string,
    jobId: string,
    fileName: string,
    contentType: string,
  ) {
    await this.get(companyId, jobId);
    const key = this.storage.questionBankKey(companyId, jobId, fileName);
    const presigned = await this.storage.presignedPut(key, contentType);
    const doc = await this.prisma.questionBankDoc.create({
      data: { jobId, fileName, storageKey: key },
    });
    return { ...presigned, documentId: doc.id };
  }
}

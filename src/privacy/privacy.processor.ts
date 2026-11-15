import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { PRIVACY_QUEUE, RetentionJobData } from './privacy.constants';

@Processor(PRIVACY_QUEUE)
export class PrivacyProcessor extends WorkerHost {
  private readonly logger = new Logger(PrivacyProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<RetentionJobData>) {
    const days = job.data.recordingRetentionDays;
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
    const chunks = await this.prisma.mediaChunk.findMany({
      where: {
        uploadedAt: { lt: cutoff },
        ...(job.data.companyId
          ? { interview: { companyId: job.data.companyId } }
          : {}),
      },
      take: 500,
    });
    const deleted = await this.prisma.mediaChunk.deleteMany({
      where: { id: { in: chunks.map((c) => c.id) } },
    });
    this.logger.log(`Retention deleted ${deleted.count} media chunks`);
    return { deleted: deleted.count };
  }
}

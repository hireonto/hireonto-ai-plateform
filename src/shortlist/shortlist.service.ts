import { Injectable } from '@nestjs/common';
import { CandidateJobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShortlistService {
  constructor(private readonly prisma: PrismaService) {}

  async autoShortlist(companyId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId, deletedAt: null },
    });
    if (!job) {
      return { updated: 0 };
    }
    const threshold = job.autoShortlistThreshold ?? 0.7;
    const rows = await this.prisma.candidateJob.findMany({
      where: {
        companyId,
        jobId,
        deletedAt: null,
        status: CandidateJobStatus.PARSED,
        fitScore: { gte: threshold },
      },
    });

    let updated = 0;
    for (const row of rows) {
      await this.prisma.candidateJob.update({
        where: { id: row.id },
        data: {
          status: CandidateJobStatus.SHORTLISTED,
          shortlistedAt: new Date(),
          history: this.appendHistory(row.history, 'auto_shortlist', {
            threshold,
            fitScore: row.fitScore,
          }),
        },
      });
      updated += 1;
    }
    return { updated, threshold };
  }

  async bulkAction(
    companyId: string,
    jobId: string,
    candidateJobIds: string[],
    action: 'shortlist' | 'reject' | 'hold',
  ) {
    const statusMap = {
      shortlist: CandidateJobStatus.SHORTLISTED,
      reject: CandidateJobStatus.REJECTED,
      hold: CandidateJobStatus.ON_HOLD,
    } as const;

    const now = new Date();
    const data: Record<string, unknown> = {
      status: statusMap[action],
      history: undefined,
    };
    if (action === 'shortlist') {
      data.shortlistedAt = now;
    }
    if (action === 'reject') {
      data.rejectedAt = now;
    }
    if (action === 'hold') {
      data.holdAt = now;
    }

    let count = 0;
    for (const id of candidateJobIds) {
      const row = await this.prisma.candidateJob.findFirst({
        where: { id, companyId, jobId, deletedAt: null },
      });
      if (!row) {
        continue;
      }
      await this.prisma.candidateJob.update({
        where: { id },
        data: {
          ...data,
          history: this.appendHistory(row.history, `manual_${action}`, {}),
        },
      });
      count += 1;
    }
    return { count, action };
  }

  history(companyId: string, jobId: string, candidateJobId: string) {
    return this.prisma.candidateJob.findFirst({
      where: { id: candidateJobId, companyId, jobId },
      select: { id: true, status: true, history: true, fitScore: true },
    });
  }

  private appendHistory(
    current: unknown,
    event: string,
    meta: Record<string, unknown>,
  ) {
    const list = Array.isArray(current) ? [...current] : [];
    list.push({ at: new Date().toISOString(), event, ...meta });
    return list;
  }
}

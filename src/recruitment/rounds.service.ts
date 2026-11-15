import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JobRoundType, RoundConductor, MeetProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlanFeaturesService } from './plan-features.service';

export type RoundInput = {
  label: string;
  roundType: JobRoundType;
  conductor: RoundConductor;
  meetProvider?: MeetProvider;
  durationMinutes?: number;
};

const DEFAULT_ROUNDS: RoundInput[] = [
  { label: 'L1 Technical (AI)', roundType: JobRoundType.L1_AI, conductor: RoundConductor.AI, meetProvider: MeetProvider.LIVEKIT, durationMinutes: 45 },
];

@Injectable()
export class RoundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planFeatures: PlanFeaturesService,
  ) {}

  async list(companyId: string, jobId: string) {
    await this.assertJob(companyId, jobId);
    await this.ensureDefaults(jobId);
    return this.prisma.jobRound.findMany({ where: { jobId }, orderBy: { orderIndex: 'asc' } });
  }

  async replace(companyId: string, jobId: string, rounds: RoundInput[]) {
    await this.planFeatures.require(companyId, 'multi_round');
    await this.assertJob(companyId, jobId);
    if (!rounds.length) throw new BadRequestException('At least one round is required');

    await this.prisma.jobRound.deleteMany({ where: { jobId } });
    await this.prisma.jobRound.createMany({
      data: rounds.map((r, orderIndex) => ({
        jobId,
        orderIndex,
        label: r.label,
        roundType: r.roundType,
        conductor: r.conductor,
        meetProvider: r.meetProvider ?? MeetProvider.LIVEKIT,
        durationMinutes: r.durationMinutes ?? 45,
      })),
    });
    return this.list(companyId, jobId);
  }

  async ensureDefaults(jobId: string) {
    const n = await this.prisma.jobRound.count({ where: { jobId } });
    if (n === 0) {
      await this.replaceInternal(jobId, DEFAULT_ROUNDS);
    }
  }

  private async replaceInternal(jobId: string, rounds: RoundInput[]) {
    await this.prisma.jobRound.createMany({
      data: rounds.map((r, orderIndex) => ({
        jobId,
        orderIndex,
        label: r.label,
        roundType: r.roundType,
        conductor: r.conductor,
        meetProvider: r.meetProvider ?? MeetProvider.LIVEKIT,
        durationMinutes: r.durationMinutes ?? 45,
      })),
    });
  }

  private async assertJob(companyId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, companyId, deletedAt: null } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }
}

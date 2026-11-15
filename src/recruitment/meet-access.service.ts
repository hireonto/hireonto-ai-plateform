import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeetAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getByToken(accessToken: string) {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { accessToken },
      include: {
        candidateJob: {
          include: {
            candidate: true,
            job: { include: { company: true, rounds: { orderBy: { orderIndex: 'asc' } } } },
          },
        },
      },
    });
    if (!schedule?.candidateJob) throw new NotFoundException('Meeting not found');

    const round = schedule.jobRoundId
      ? schedule.candidateJob.job.rounds.find((r) => r.id === schedule.jobRoundId)
      : null;

    return {
      scheduledAt: schedule.scheduledAt,
      meetUrl: schedule.meetUrl,
      meetProvider: schedule.meetProvider,
      jobTitle: schedule.candidateJob.job.title,
      roundLabel: round?.label ?? 'Interview',
      company: {
        name: schedule.candidateJob.job.company.name,
        logoUrl: schedule.candidateJob.job.company.logoUrl,
        primaryColor: schedule.candidateJob.job.company.primaryColor,
        secondaryColor: schedule.candidateJob.job.company.secondaryColor,
      },
    };
  }
}

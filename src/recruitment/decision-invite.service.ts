import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RecruitmentDecisionOutcome } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DecisionsService } from './decisions.service';

@Injectable()
export class DecisionInviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly decisions: DecisionsService,
    private readonly config: ConfigService,
  ) {}

  async createInvite(companyId: string, candidateJobId: string, createdById: string, ttlHours = 168) {
    const cj = await this.prisma.candidateJob.findFirst({
      where: { id: candidateJobId, companyId },
      include: { candidate: true, job: true },
    });
    if (!cj) throw new NotFoundException('Candidate not found');

    const invite = await this.prisma.decisionReviewInvite.create({
      data: {
        companyId,
        candidateJobId,
        createdById,
        expiresAt: new Date(Date.now() + ttlHours * 3600_000),
      },
    });
    const appUrl = this.config.get<string>('appUrl') ?? 'http://localhost:3000';
    return {
      inviteUrl: `${appUrl}/recruit/decide/${invite.token}`,
      expiresAt: invite.expiresAt,
    };
  }

  async getInviteView(token: string) {
    const invite = await this.prisma.decisionReviewInvite.findUnique({
      where: { token },
      include: {
        candidateJob: {
          include: {
            candidate: true,
            job: { include: { rounds: { orderBy: { orderIndex: 'asc' } } } },
          },
        },
      },
    });
    if (!invite || invite.expiresAt < new Date()) {
      throw new NotFoundException('Invite expired or not found');
    }
    if (invite.usedAt) throw new BadRequestException('This invite was already used');

    const c = invite.candidateJob.candidate;
    return {
      candidate: {
        name: [c.firstName, c.lastName].filter(Boolean).join(' '),
        email: c.email,
      },
      job: { title: invite.candidateJob.job.title, rounds: invite.candidateJob.job.rounds },
      status: invite.candidateJob.status,
      fitScore: invite.candidateJob.fitScore,
      expiresAt: invite.expiresAt,
    };
  }

  async submitViaInvite(
    token: string,
    outcome: RecruitmentDecisionOutcome,
    reason?: string,
    reviewerName?: string,
  ) {
    const invite = await this.prisma.decisionReviewInvite.findUnique({ where: { token } });
    if (!invite || invite.expiresAt < new Date()) throw new NotFoundException('Invite expired or not found');
    if (invite.usedAt) throw new BadRequestException('Invite already used');

    const result = await this.decisions.submit(
      invite.companyId,
      invite.candidateJobId,
      invite.createdById ?? 'guest-reviewer',
      outcome,
      reason ? `${reason}${reviewerName ? ` (via ${reviewerName})` : ''}` : reviewerName ? `Reviewed by ${reviewerName}` : undefined,
    );

    await this.prisma.decisionReviewInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    return result;
  }
}

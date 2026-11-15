import { Injectable, NotFoundException } from '@nestjs/common';
import { CandidateJobStatus, RecruitmentDecisionOutcome } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class DecisionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async submit(
    companyId: string,
    candidateJobId: string,
    decidedById: string,
    outcome: RecruitmentDecisionOutcome,
    reason?: string,
  ) {
    const cj = await this.prisma.candidateJob.findFirst({
      where: { id: candidateJobId, companyId },
      include: { candidate: true, job: { include: { rounds: { orderBy: { orderIndex: 'asc' } } } } },
    });
    if (!cj) throw new NotFoundException('Candidate not found for this job');

    const decision = await this.prisma.recruitmentDecision.create({
      data: {
        companyId,
        candidateJobId,
        jobId: cj.jobId,
        outcome,
        reason,
        decidedById,
      },
    });

    const status =
      outcome === RecruitmentDecisionOutcome.SELECT
        ? CandidateJobStatus.HIRED
        : outcome === RecruitmentDecisionOutcome.REJECT
          ? CandidateJobStatus.REJECTED
          : CandidateJobStatus.ON_HOLD;

    await this.prisma.candidateJob.update({
      where: { id: candidateJobId },
      data: { status },
    });

    const appUrl = this.config.get<string>('appUrl') ?? 'http://localhost:3000';
    const decisionUrl = `${appUrl}/decision/${decision.publicToken}`;
    const to = cj.candidate.email;
    if (to) {
      const roundLines =
        outcome === RecruitmentDecisionOutcome.SELECT
          ? cj.job.rounds
              .map((r, i) => `<li>Round ${i + 1}: ${r.label} (${r.conductor === 'AI' ? 'AI' : 'Human interviewer'})</li>`)
              .join('')
          : '';

      let body = '';
      if (outcome === RecruitmentDecisionOutcome.SELECT) {
        body = `<p>Congratulations! You have been selected to move forward for <b>${cj.job.title}</b>.</p>
${roundLines ? `<p>Next steps:</p><ul>${roundLines}</ul>` : '<p>The team will contact you about the next round.</p>'}`;
      } else if (outcome === RecruitmentDecisionOutcome.REJECT) {
        body = `<p>Thank you for interviewing for <b>${cj.job.title}</b>. We will not be moving forward at this time.</p>
${reason ? `<p>Note: ${reason}</p>` : ''}`;
      } else {
        body = `<p>Your application for <b>${cj.job.title}</b> is on hold while we complete the process.</p>
${reason ? `<p>${reason}</p>` : ''}`;
      }

      body += `<p><a href="${decisionUrl}">View details</a></p>`;

      await this.email.send({
        companyId,
        to,
        subject:
          outcome === RecruitmentDecisionOutcome.SELECT
            ? `Selected — ${cj.job.title}`
            : outcome === RecruitmentDecisionOutcome.REJECT
              ? `Update on your application — ${cj.job.title}`
              : `Application on hold — ${cj.job.title}`,
        template: 'recruitment_decision',
        html: body,
        metadata: { decisionId: decision.id, outcome },
      });

      await this.prisma.recruitmentDecision.update({
        where: { id: decision.id },
        data: { candidateNotifiedAt: new Date() },
      });
    }

    return { decision, decisionUrl };
  }

  async getByToken(token: string) {
    const d = await this.prisma.recruitmentDecision.findUnique({
      where: { publicToken: token },
      include: {
        candidateJob: {
          include: {
            candidate: true,
            job: { include: { rounds: { orderBy: { orderIndex: 'asc' } } } },
          },
        },
      },
    });
    if (!d) throw new NotFoundException('Decision not found');
    return {
      outcome: d.outcome,
      reason: d.reason,
      decidedAt: d.createdAt,
      candidate: {
        name: [d.candidateJob.candidate.firstName, d.candidateJob.candidate.lastName].filter(Boolean).join(' '),
        email: d.candidateJob.candidate.email,
      },
      job: { title: d.candidateJob.job.title, rounds: d.candidateJob.job.rounds },
    };
  }
}

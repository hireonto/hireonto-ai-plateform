import { Injectable, Logger } from '@nestjs/common';
import { CandidateJobStatus, InterviewScheduleStatus, RoundConductor } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { EmailService } from '../notifications/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { CalendarService } from './calendar.service';
import { RoundsService } from './rounds.service';

@Injectable()
export class RoundAdvanceService {
  private readonly logger = new Logger(RoundAdvanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rounds: RoundsService,
    private readonly calendar: CalendarService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  /** After an AI interview completes, advance multi-round pipeline when configured. */
  async afterInterviewCompleted(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        job: { include: { company: true } },
        candidate: true,
        jobRound: true,
      },
    });
    if (!interview) return;

    const cj = await this.prisma.candidateJob.findUnique({
      where: { candidateId_jobId: { candidateId: interview.candidateId, jobId: interview.jobId } },
    });
    if (!cj) return;

    await this.rounds.ensureDefaults(interview.jobId);
    const jobRounds = await this.prisma.jobRound.findMany({
      where: { jobId: interview.jobId },
      orderBy: { orderIndex: 'asc' },
    });
    if (jobRounds.length <= 1) return;

    const completedIndex =
      interview.jobRound?.orderIndex ??
      jobRounds.find((r) => r.conductor === RoundConductor.AI)?.orderIndex ??
      cj.currentRoundIndex;

    const nextIndex = completedIndex + 1;
    const nextRound = jobRounds.find((r) => r.orderIndex === nextIndex);
    if (!nextRound) {
      await this.prisma.candidateJob.update({
        where: { id: cj.id },
        data: { currentRoundIndex: completedIndex, status: CandidateJobStatus.INTERVIEW_COMPLETED },
      });
      return;
    }

    await this.prisma.candidateJob.update({
      where: { id: cj.id },
      data: { currentRoundIndex: nextIndex },
    });

    const appUrl = this.config.get<string>('appUrl') ?? 'http://localhost:3000';
    const candidateName = [interview.candidate.firstName, interview.candidate.lastName].filter(Boolean).join(' ') || 'there';
    const to = interview.candidate.email;

    if (nextRound.conductor === RoundConductor.HUMAN) {
      const scheduledAt = new Date(Date.now() + 72 * 3600_000);
      const meet = await this.calendar.createInterviewEvent(interview.companyId, {
        title: `${nextRound.label} — ${interview.job.title}`,
        scheduledAt,
        attendeeEmail: to ?? undefined,
      });
      const accessToken = randomBytes(16).toString('hex');
      await this.prisma.interviewSchedule.create({
        data: {
          companyId: interview.companyId,
          candidateJobId: cj.id,
          jobId: interview.jobId,
          jobRoundId: nextRound.id,
          scheduledAt,
          meetProvider: meet.provider,
          meetUrl: meet.url,
          calendarEventId: meet.eventId,
          accessToken,
          status: InterviewScheduleStatus.CONFIRMED,
        },
      });
      await this.prisma.candidateJob.update({
        where: { id: cj.id },
        data: { status: CandidateJobStatus.INTERVIEW_SCHEDULED },
      });
      if (to) {
        await this.email.send({
          companyId: interview.companyId,
          to,
          subject: `Next round: ${nextRound.label}`,
          template: 'round_advance_human',
          html: `<p>Hi ${candidateName},</p>
<p>You completed the previous round for <b>${interview.job.title}</b>. Your next step is <b>${nextRound.label}</b>.</p>
<p>Join at ${scheduledAt.toLocaleString()}: <a href="${meet.url}">${meet.url}</a></p>
<p>Or open your interview room: <a href="${appUrl}/candidate/meet/${accessToken}">${appUrl}/candidate/meet/${accessToken}</a></p>`,
          metadata: { candidateJobId: cj.id, roundId: nextRound.id },
        });
      }
      return;
    }

    // Next AI round — back to shortlisted for recruiter to send invite
    await this.prisma.candidateJob.update({
      where: { id: cj.id },
      data: { status: CandidateJobStatus.SHORTLISTED },
    });
    if (to) {
      await this.email.send({
        companyId: interview.companyId,
        to,
        subject: `Next step: ${nextRound.label}`,
        template: 'round_advance_ai',
        html: `<p>Hi ${candidateName},</p>
<p>Thank you for completing your interview for <b>${interview.job.title}</b>.</p>
<p>The hiring team will send you an invite for <b>${nextRound.label}</b> shortly.</p>`,
        metadata: { candidateJobId: cj.id, roundId: nextRound.id },
      });
    }
    this.logger.log(`Advanced ${cj.id} to round ${nextIndex} (${nextRound.label})`);
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import {
  CandidateJobStatus,
  InterviewStatus,
  RoundConductor,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Queue } from 'bullmq';
import { randomBytes } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  INTERVIEW_JOBS_QUEUE,
  InterviewScheduledJob,
} from './interviews.constants';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class InterviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @InjectQueue(INTERVIEW_JOBS_QUEUE)
    private readonly interviewQueue: Queue<InterviewScheduledJob>,
  ) {}

  list(companyId: string, jobId?: string) {
    return this.prisma.interview.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(jobId ? { jobId } : {}),
      },
      include: {
        candidate: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        job: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFromShortlist(
    companyId: string,
    jobId: string,
    candidateJobIds: string[],
    // Recruiter-entered addresses by candidateJobId, for resumes with no or a wrong email.
    emails: Record<string, string> = {},
  ) {
    const config = await this.prisma.jobInterviewConfig.findFirst({
      where: { job: { id: jobId, companyId } },
    });
    const windowHours = config?.windowHours ?? 72;
    const created = [];
    const skipped: Array<{ candidateJobId: string; reason: string }> = [];

    for (const cjId of candidateJobIds) {
      const cj = await this.prisma.candidateJob.findFirst({
        where: {
          id: cjId,
          companyId,
          jobId,
          status: CandidateJobStatus.SHORTLISTED,
          deletedAt: null,
        },
        include: { candidate: true, job: { include: { company: true } } },
      });
      if (!cj) {
        skipped.push({ candidateJobId: cjId, reason: 'Not shortlisted' });
        continue;
      }
      let to = cj.candidate.email;
      if (emails[cjId]?.trim()) {
        try {
          to = await this.setCandidateEmail(companyId, cj.candidateId, emails[cjId]);
        } catch (err) {
          skipped.push({ candidateJobId: cjId, reason: (err as Error).message });
          continue;
        }
      }
      if (!to) {
        skipped.push({ candidateJobId: cjId, reason: 'No email address' });
        continue;
      }

      const windowEnd = new Date(Date.now() + windowHours * 3600 * 1000);
      const accessToken = randomBytes24();
      const tempPassword = randomBytes(4).toString('hex');
      const tempPasswordHash = await bcrypt.hash(tempPassword, 12);

      const aiRound = await this.prisma.jobRound.findFirst({
        where: { jobId, conductor: RoundConductor.AI },
        orderBy: { orderIndex: 'asc' },
      });

      const interview = await this.prisma.interview.create({
        data: {
          companyId,
          jobId,
          candidateId: cj.candidateId,
          status: InterviewStatus.INVITED,
          windowEnd,
          accessToken,
          jobRoundId: aiRound?.id,
        },
      });

      if (aiRound) {
        await this.prisma.candidateJob.update({
          where: { id: cj.id },
          data: { currentRoundIndex: aiRound.orderIndex },
        });
      }

      await this.prisma.candidate.update({
        where: { id: cj.candidateId },
        data: { tempPasswordHash },
      });

      await this.prisma.candidateJob.update({
        where: { id: cj.id },
        data: { status: CandidateJobStatus.INTERVIEW_SCHEDULED },
      });

      await this.scheduleJobs(interview.id, windowEnd);

      const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
      const mail = await this.notifications.sendCandidateInvite({
        companyId,
        to,
        companyName: cj.job.company.name,
        loginUrl: `${appUrl}/candidate/interview/${accessToken}`,
        tempPassword,
        deadlineIso: windowEnd.toISOString(),
        primaryColor: cj.job.company.primaryColor ?? '#2563eb',
      });

      created.push({ interviewId: interview.id, candidateJobId: cj.id, email: to, emailSent: mail.sent });
    }

    return { created, skipped };
  }

  /** Validates and saves a recruiter-entered email on the candidate; returns the normalised address. */
  private async setCandidateEmail(companyId: string, candidateId: string, raw: string): Promise<string> {
    const email = raw.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      throw new BadRequestException(`"${raw}" is not a valid email`);
    }
    const taken = await this.prisma.candidate.findFirst({
      where: { companyId, email, id: { not: candidateId }, deletedAt: null },
      select: { id: true },
    });
    if (taken) {
      throw new BadRequestException(`${email} already belongs to another candidate`);
    }
    await this.prisma.candidate.update({ where: { id: candidateId }, data: { email } });
    return email;
  }

  async extend(companyId: string, interviewId: string, extraHours: number) {
    const interview = await this.get(companyId, interviewId);
    if (interview.status === InterviewStatus.COMPLETED) {
      throw new BadRequestException('Interview already completed');
    }
    const windowEnd = new Date(
      interview.windowEnd.getTime() + extraHours * 3600 * 1000,
    );
    const updated = await this.prisma.interview.update({
      where: { id: interviewId },
      data: { windowEnd, status: InterviewStatus.INVITED },
    });
    await this.scheduleJobs(interviewId, windowEnd);
    return updated;
  }

  async cancel(companyId: string, interviewId: string) {
    await this.get(companyId, interviewId);
    return this.prisma.interview.update({
      where: { id: interviewId },
      data: { status: InterviewStatus.CANCELLED },
    });
  }

  async resendInvite(companyId: string, interviewId: string, email?: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, companyId, deletedAt: null },
      include: {
        candidate: true,
        company: true,
        job: true,
      },
    });
    if (!interview) {
      throw new BadRequestException('Interview not found');
    }
    const to = email?.trim()
      ? await this.setCandidateEmail(companyId, interview.candidateId, email)
      : interview.candidate.email;
    if (!to) {
      throw new BadRequestException('Candidate email missing — enter one to send the invite');
    }
    const tempPassword = randomBytes(4).toString('hex');
    await this.prisma.candidate.update({
      where: { id: interview.candidateId },
      data: { tempPasswordHash: await bcrypt.hash(tempPassword, 12) },
    });
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const mail = await this.notifications.sendCandidateInvite({
      companyId,
      to,
      companyName: interview.company.name,
      loginUrl: `${appUrl}/candidate/interview/${interview.accessToken}`,
      tempPassword,
      deadlineIso: interview.windowEnd.toISOString(),
      primaryColor: interview.company.primaryColor ?? '#2563eb',
    });
    return { resent: true, email: to, emailSent: mail.sent };
  }

  private async get(companyId: string, interviewId: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, companyId, deletedAt: null },
    });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }
    return interview;
  }

  private async scheduleJobs(interviewId: string, windowEnd: Date) {
    const msUntilEnd = windowEnd.getTime() - Date.now();
    const delay24 = msUntilEnd - 24 * 3600 * 1000;
    const delay4 = msUntilEnd - 4 * 3600 * 1000;

    if (delay24 > 0) {
      await this.interviewQueue.add(
        'reminder-24',
        { type: 'reminder', interviewId, hoursLeft: 24 },
        { delay: delay24, jobId: `${interviewId}-r24` },
      );
    }
    if (delay4 > 0) {
      await this.interviewQueue.add(
        'reminder-4',
        { type: 'reminder', interviewId, hoursLeft: 4 },
        { delay: delay4, jobId: `${interviewId}-r4` },
      );
    }
    await this.interviewQueue.add(
      'expire',
      { type: 'expire', interviewId },
      { delay: Math.max(msUntilEnd, 0), jobId: `${interviewId}-expire` },
    );
  }
}

function randomBytes24() {
  return randomBytes(24).toString('hex');
}

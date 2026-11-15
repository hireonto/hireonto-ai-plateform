import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InterviewStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  INTERVIEW_JOBS_QUEUE,
  InterviewScheduledJob,
} from './interviews.constants';

@Processor(INTERVIEW_JOBS_QUEUE)
export class InterviewsProcessor extends WorkerHost {
  private readonly logger = new Logger(InterviewsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<InterviewScheduledJob>) {
    const data = job.data;
    if (data.type === 'expire') {
      return this.expire(data.interviewId);
    }
    return this.reminder(data.interviewId, data.hoursLeft);
  }

  private async expire(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
    });
    if (!interview || interview.status === InterviewStatus.COMPLETED) {
      return { skipped: true };
    }
    if (interview.windowEnd > new Date()) {
      return { skipped: true, reason: 'not_yet_due' };
    }
    await this.prisma.interview.update({
      where: { id: interviewId },
      data: { status: InterviewStatus.EXPIRED },
    });
    return { expired: true };
  }

  private async reminder(interviewId: string, hoursLeft: 24 | 4) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        company: true,
      },
    });
    if (
      !interview?.candidate?.email ||
      interview.status === InterviewStatus.COMPLETED ||
      interview.status === InterviewStatus.EXPIRED
    ) {
      return { skipped: true };
    }
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    await this.notifications.sendInterviewReminder({
      companyId: interview.companyId,
      to: interview.candidate.email,
      companyName: interview.company.name,
      hoursLeft,
      loginUrl: `${appUrl}/candidate/interview/${interview.accessToken}`,
    });
    this.logger.log(`Reminder T-${hoursLeft}h sent for ${interviewId}`);
    return { sent: true };
  }
}

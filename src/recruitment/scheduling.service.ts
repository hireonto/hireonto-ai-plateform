import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CandidateJobStatus,
  InterviewScheduleStatus,
  OutboundCampaignStatus,
  OutboundCallStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { CalendarService } from './calendar.service';
import { PlanFeaturesService } from './plan-features.service';
import { PstnService } from './pstn.service';

@Injectable()
export class SchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planFeatures: PlanFeaturesService,
    private readonly email: EmailService,
    private readonly calendar: CalendarService,
    private readonly config: ConfigService,
    private readonly pstn: PstnService,
  ) {}

  async startCallCampaign(
    companyId: string,
    jobId: string,
    createdById: string,
    candidateJobIds: string[],
    promptTemplate: string,
  ) {
    await this.planFeatures.require(companyId, 'pstn_outbound');
    if (!promptTemplate.trim()) throw new BadRequestException('Prompt is required');

    const rows = await this.prisma.candidateJob.findMany({
      where: {
        id: { in: candidateJobIds },
        companyId,
        jobId,
        status: CandidateJobStatus.SHORTLISTED,
        deletedAt: null,
      },
      include: { candidate: true },
    });
    if (!rows.length) throw new BadRequestException('No shortlisted candidates selected');

    const campaign = await this.prisma.outboundCallCampaign.create({
      data: {
        companyId,
        jobId,
        createdById,
        promptTemplate,
        status: OutboundCampaignStatus.RUNNING,
        calls: {
          create: rows.map((r) => ({
            candidateJobId: r.id,
            phone: r.candidate.phone ?? undefined,
            status: OutboundCallStatus.QUEUED,
          })),
        },
      },
      include: { calls: true },
    });

    let twilio = 0;
    let simulated = 0;
    for (const call of campaign.calls) {
      const row = rows.find((r) => r.id === call.candidateJobId);
      const dialed = await this.pstn.dialOutbound(call.id, row?.candidate.phone ?? call.phone);
      if (dialed) {
        twilio++;
      } else if (this.pstn.isConfigured()) {
        // Twilio configured but this call failed — leave status from pstn service
      } else {
        await this.simulateOutboundCall(companyId, jobId, call.id, promptTemplate);
        simulated++;
      }
    }

    const finalStatus =
      twilio > 0 && simulated === 0
        ? OutboundCampaignStatus.RUNNING
        : OutboundCampaignStatus.COMPLETED;

    await this.prisma.outboundCallCampaign.update({
      where: { id: campaign.id },
      data: { status: finalStatus },
    });

    return { campaignId: campaign.id, calls: campaign.calls.length, twilio, simulated };
  }

  private async simulateOutboundCall(
    companyId: string,
    jobId: string,
    callId: string,
    prompt: string,
  ) {
    const call = await this.prisma.outboundCall.findUnique({
      where: { id: callId },
      include: { candidateJob: { include: { candidate: true, job: true } } },
    });
    if (!call?.candidateJob) return;

    const proposed = new Date(Date.now() + 48 * 3600_000);
    await this.prisma.outboundCall.update({
      where: { id: callId },
      data: {
        status: OutboundCallStatus.SCHEDULED,
        proposedSlot: proposed,
        transcript: `[PSTN stub] Prompt: ${prompt.slice(0, 200)}… Candidate agreed to ${proposed.toISOString()}`,
      },
    });

    await this.confirmSchedule(companyId, call.candidateJobId, jobId, proposed, call.candidateJob.candidate.email);
  }

  async confirmSchedule(
    companyId: string,
    candidateJobId: string,
    jobId: string,
    scheduledAt: Date,
    emailTo?: string | null,
  ) {
    await this.planFeatures.require(companyId, 'calendar_sync');
    const cj = await this.prisma.candidateJob.findFirst({
      where: { id: candidateJobId, companyId, jobId },
      include: { candidate: true, job: true },
    });
    if (!cj) throw new NotFoundException('Candidate job not found');

    const meet = await this.calendar.createInterviewEvent(companyId, {
      title: `Interview: ${cj.job.title}`,
      scheduledAt,
      attendeeEmail: cj.candidate.email ?? emailTo ?? undefined,
    });

    const schedule = await this.prisma.interviewSchedule.create({
      data: {
        companyId,
        candidateJobId,
        jobId,
        scheduledAt,
        meetProvider: meet.provider,
        meetUrl: meet.url,
        calendarEventId: meet.eventId,
        accessToken: randomBytes(16).toString('hex'),
        status: InterviewScheduleStatus.CONFIRMED,
      },
    });

    await this.prisma.candidateJob.update({
      where: { id: candidateJobId },
      data: { status: CandidateJobStatus.INTERVIEW_SCHEDULED },
    });

    const to = cj.candidate.email ?? emailTo;
    if (to) {
      const appUrl = this.config.get<string>('appUrl') ?? 'http://localhost:3000';
      const meetRoom = schedule.accessToken ? `${appUrl}/candidate/meet/${schedule.accessToken}` : meet.url;
      await this.email.send({
        companyId,
        to,
        subject: `Interview scheduled — ${cj.job.title}`,
        template: 'interview_scheduled',
        html: `<p>Your interview for <b>${cj.job.title}</b> is scheduled for <b>${scheduledAt.toLocaleString()}</b>.</p>
<p>Join: <a href="${meet.url}">${meet.url}</a></p>
<p>Interview room: <a href="${meetRoom}">${meetRoom}</a></p>`,
        metadata: { scheduleId: schedule.id, candidateJobId },
      });
      await this.prisma.interviewSchedule.update({
        where: { id: schedule.id },
        data: { confirmationSentAt: new Date() },
      });
    }

    return schedule;
  }

  async maybeCompleteCampaignForCall(callId: string) {
    const call = await this.prisma.outboundCall.findUnique({
      where: { id: callId },
      include: { campaign: { include: { calls: true } } },
    });
    if (!call?.campaign) return;
    const terminal: OutboundCallStatus[] = [
      OutboundCallStatus.SCHEDULED,
      OutboundCallStatus.FAILED,
      OutboundCallStatus.NO_ANSWER,
      OutboundCallStatus.COMPLETED,
    ];
    const allDone = call.campaign.calls.every((c) => terminal.includes(c.status));
    if (allDone) {
      await this.prisma.outboundCallCampaign.update({
        where: { id: call.campaign.id },
        data: { status: OutboundCampaignStatus.COMPLETED },
      });
    }
  }
}

import { Body, Controller, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OutboundCallStatus } from '@prisma/client';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PstnService } from './pstn.service';
import { SchedulingService } from './scheduling.service';

@ApiTags('webhooks')
@Controller('webhooks/twilio')
export class TwilioWebhookController {
  constructor(
    private readonly pstn: PstnService,
    private readonly prisma: PrismaService,
    private readonly scheduling: SchedulingService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('outbound')
  @ApiOperation({ summary: 'Twilio voice TwiML for outbound scheduling calls' })
  async outbound(@Query('callId') callId: string, @Res() res: Response) {
    const call = await this.prisma.outboundCall.findUnique({
      where: { id: callId },
      include: { campaign: true },
    });
    if (!call) {
      res.type('text/xml').send(this.pstn.buildDeclineTwiml());
      return;
    }
    const base = this.config.get<string>('backendPublicUrl')!.replace(/\/$/, '');
    const gatherUrl = `${base}/webhooks/twilio/gather?callId=${encodeURIComponent(callId)}`;
    const twiml = this.pstn.buildOutboundTwiml(callId, call.campaign.promptTemplate, gatherUrl);
    res.type('text/xml').send(twiml);
  }

  @Public()
  @Post('gather')
  async gather(
    @Query('callId') callId: string,
    @Body() body: { Digits?: string },
    @Res() res: Response,
  ) {
    const digit = body.Digits?.trim();
    const call = await this.prisma.outboundCall.findUnique({
      where: { id: callId },
      include: { candidateJob: { include: { candidate: true, job: true } }, campaign: true },
    });
    if (!call?.candidateJob) {
      res.type('text/xml').send(this.pstn.buildDeclineTwiml());
      return;
    }

    if (digit !== '1') {
      await this.prisma.outboundCall.update({
        where: { id: callId },
        data: { status: OutboundCallStatus.COMPLETED, transcript: 'Candidate declined or no input' },
      });
      await this.scheduling.maybeCompleteCampaignForCall(callId);
      res.type('text/xml').send(this.pstn.buildDeclineTwiml());
      return;
    }

    const proposed = new Date(Date.now() + 48 * 3600_000);
    await this.prisma.outboundCall.update({
      where: { id: callId },
      data: {
        status: OutboundCallStatus.SCHEDULED,
        proposedSlot: proposed,
        transcript: `Confirmed via PSTN (digit 1). Prompt: ${call.campaign.promptTemplate.slice(0, 120)}…`,
      },
    });

    await this.scheduling.confirmSchedule(
      call.campaign.companyId,
      call.candidateJobId,
      call.campaign.jobId,
      proposed,
      call.candidateJob.candidate.email,
    );

    await this.scheduling.maybeCompleteCampaignForCall(callId);
    res.type('text/xml').send(this.pstn.buildConfirmTwiml());
  }

  @Public()
  @Post('status')
  async status(@Query('callId') callId: string, @Body() body: { CallStatus?: string }) {
    if (!callId) return { ok: true };
    const st = body.CallStatus;
    if (st === 'no-answer' || st === 'busy' || st === 'failed' || st === 'canceled') {
      await this.prisma.outboundCall.updateMany({
        where: { id: callId, status: OutboundCallStatus.DIALING },
        data: {
          status: OutboundCallStatus.NO_ANSWER,
          error: st,
        },
      });
      await this.scheduling.maybeCompleteCampaignForCall(callId);
    }
    return { ok: true };
  }
}

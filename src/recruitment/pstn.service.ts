import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OutboundCallStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PstnService {
  private readonly logger = new Logger(PstnService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  isConfigured(): boolean {
    return !!(
      this.config.get<string>('twilio.accountSid') &&
      this.config.get<string>('twilio.authToken') &&
      this.config.get<string>('twilio.fromNumber') &&
      this.config.get<string>('backendPublicUrl')
    );
  }

  async dialOutbound(callId: string, phone: string | null | undefined): Promise<boolean> {
    if (!phone?.trim()) {
      await this.prisma.outboundCall.update({
        where: { id: callId },
        data: { status: OutboundCallStatus.FAILED, error: 'No phone number on candidate' },
      });
      return false;
    }

    if (!this.isConfigured()) {
      return false;
    }

    const sid = this.config.get<string>('twilio.accountSid')!;
    const token = this.config.get<string>('twilio.authToken')!;
    const from = this.config.get<string>('twilio.fromNumber')!;
    const base = this.config.get<string>('backendPublicUrl')!.replace(/\/$/, '');
    const voiceUrl = `${base}/webhooks/twilio/outbound?callId=${encodeURIComponent(callId)}`;
    const statusUrl = `${base}/webhooks/twilio/status?callId=${encodeURIComponent(callId)}`;

    const body = new URLSearchParams({
      To: phone,
      From: from,
      Url: voiceUrl,
      Method: 'POST',
      StatusCallback: statusUrl,
      StatusCallbackMethod: 'POST',
      StatusCallbackEvent: 'completed',
      MachineDetection: 'Enable',
    });

    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const json = (await res.json()) as { sid?: string; message?: string };
    if (!res.ok) {
      this.logger.warn(`Twilio dial failed: ${json.message ?? res.statusText}`);
      await this.prisma.outboundCall.update({
        where: { id: callId },
        data: { status: OutboundCallStatus.FAILED, error: json.message ?? 'Twilio dial failed' },
      });
      return false;
    }

    await this.prisma.outboundCall.update({
      where: { id: callId },
      data: { status: OutboundCallStatus.DIALING, transcript: `twilio:${json.sid}` },
    });
    return true;
  }

  buildOutboundTwiml(callId: string, prompt: string, gatherUrl: string): string {
    const say = this.escapeXml(prompt.slice(0, 1200));
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${say}</Say>
  <Gather numDigits="1" action="${this.escapeXml(gatherUrl)}" method="POST" timeout="8">
    <Say voice="Polly.Joanna">Press 1 to confirm an interview slot in the next 48 hours, or press 2 to decline.</Say>
  </Gather>
  <Say voice="Polly.Joanna">We did not receive input. Goodbye.</Say>
</Response>`;
  }

  buildDeclineTwiml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Thank you. Goodbye.</Say></Response>`;
  }

  buildConfirmTwiml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Great, your interview is scheduled. You will receive a confirmation email shortly. Goodbye.</Say></Response>`;
  }

  private escapeXml(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }
}

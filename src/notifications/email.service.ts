import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

export interface SendEmailInput {
  companyId: string;
  to: string;
  subject: string;
  template: string;
  html: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter?: Transporter;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async send(input: SendEmailInput) {
    const log = await this.prisma.emailLog.create({
      data: {
        companyId: input.companyId,
        to: input.to,
        subject: input.subject,
        template: input.template,
        metadata: (input.metadata ?? {}) as object,
        status: 'queued',
      },
    });

    const host = this.config.get<string>('email.smtp.host');
    const port = this.config.get<number>('email.smtp.port');
    this.logger.log(
      `[${input.template}] → ${input.to} (smtp://${host}:${port}) subject="${input.subject}"`,
    );

    try {
      this.transporter ??= createTransport({ host, port, secure: port === 465 });
      const info = await this.transporter.sendMail({
        from: this.config.get<string>('email.from') ?? 'HireMind <no-reply@hiremind.local>',
        to: input.to,
        subject: input.subject,
        html: input.html,
      });
      await this.prisma.emailLog.update({
        where: { id: log.id },
        data: { status: 'sent', sentAt: new Date(), providerId: info.messageId },
      });
    } catch (err) {
      // A mail outage must not fail the invite itself; the log row records it.
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Email to ${input.to} failed: ${message}`);
      await this.prisma.emailLog.update({
        where: { id: log.id },
        data: { status: 'failed', error: message },
      });
      return { id: log.id, sent: false };
    }

    return { id: log.id, sent: true };
  }
}

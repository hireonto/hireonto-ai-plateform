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

const DEFAULT_FROM = 'HireOnto <no-reply@hireonto.com>';
const RESEND_URL = 'https://api.resend.com/emails';

/**
 * Sends email through SMTP (EMAIL_PROVIDER=smtp, e.g. Gmail with an App Password)
 * or the Resend HTTPS API (EMAIL_PROVIDER=resend). Every send is recorded in EmailLog;
 * a failed send is logged there and never throws, so it cannot break the caller's flow.
 */
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

    const provider = this.config.get<string>('email.provider') ?? 'smtp';
    this.logger.log(`[${input.template}] → ${input.to} via ${this.describeProvider(provider)} subject="${input.subject}"`);

    try {
      const providerId =
        provider === 'resend' ? await this.sendViaResend(input) : await this.sendViaSmtp(input);
      await this.prisma.emailLog.update({
        where: { id: log.id },
        data: { status: 'sent', sentAt: new Date(), providerId },
      });
    } catch (err) {
      const message = describeError(err);
      this.logger.warn(`Email to ${input.to} failed: ${message}`);
      await this.prisma.emailLog.update({
        where: { id: log.id },
        data: { status: 'failed', error: message },
      });
      return { id: log.id, sent: false };
    }

    return { id: log.id, sent: true };
  }

  private from(): string {
    return this.config.get<string>('email.from') ?? DEFAULT_FROM;
  }

  private async sendViaSmtp(input: SendEmailInput): Promise<string> {
    if (!this.transporter) {
      const user = this.config.get<string>('email.smtp.user');
      const pass = this.config.get<string>('email.smtp.pass');
      this.transporter = createTransport({
        host: this.config.get<string>('email.smtp.host'),
        port: this.config.get<number>('email.smtp.port'),
        secure: this.config.get<boolean>('email.smtp.secure') ?? false,
        auth: user ? { user, pass } : undefined,
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
      });
    }
    const info = await this.transporter.sendMail({
      from: this.from(),
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return info.messageId;
  }

  private async sendViaResend(input: SendEmailInput): Promise<string> {
    const apiKey = this.config.get<string>('email.resend.apiKey');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: this.from(), to: [input.to], subject: input.subject, html: input.html }),
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (!res.ok) {
      throw new Error(`Resend ${res.status}: ${body.message ?? body.name ?? res.statusText}`);
    }
    return body.id ?? '';
  }

  private describeProvider(provider: string): string {
    if (provider === 'resend') return 'resend';
    const host = this.config.get<string>('email.smtp.host');
    const port = this.config.get<number>('email.smtp.port');
    return `smtp://${host}:${port}`;
  }
}

/** Connection errors to "localhost" arrive as an AggregateError with an empty message. */
export function describeError(err: unknown): string {
  if (err instanceof AggregateError && err.errors.length) {
    return err.errors.map(describeError).join('; ');
  }
  if (err instanceof Error) {
    const code = (err as Error & { code?: string }).code;
    const text = err.message || err.name;
    return code && !text.includes(code) ? `${code}: ${text}` : text;
  }
  return String(err);
}

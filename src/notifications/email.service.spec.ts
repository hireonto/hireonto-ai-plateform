import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { describeError, EmailService } from './email.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

function setup(config: Record<string, unknown>) {
  const updates: Array<Record<string, unknown>> = [];
  const prisma = {
    emailLog: {
      create: jest.fn().mockResolvedValue({ id: 'log1' }),
      update: jest.fn().mockImplementation(({ data }) => {
        updates.push(data);
        return Promise.resolve({});
      }),
    },
  } as unknown as PrismaService;
  const cfg = { get: (key: string) => config[key] } as unknown as ConfigService;
  return { service: new EmailService(cfg, prisma), updates };
}

const input = { companyId: 'c1', to: 'a@b.com', subject: 'Hi', template: 't', html: '<p>x</p>' };

describe('EmailService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('sends through Resend over HTTPS when EMAIL_PROVIDER=resend', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 're_123' }), { status: 200 }));
    const { service, updates } = setup({
      'email.provider': 'resend',
      'email.resend.apiKey': 're_key',
      'email.from': 'HireOnto <no-reply@hireonto.com>',
    });

    await expect(service.send(input)).resolves.toEqual({ id: 'log1', sent: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer re_key');
    expect(JSON.parse(init!.body as string)).toMatchObject({
      from: 'HireOnto <no-reply@hireonto.com>',
      to: ['a@b.com'],
    });
    expect(updates[0]).toMatchObject({ status: 'sent', providerId: 're_123' });
  });

  it('records the Resend error message when the API rejects the email', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ message: 'domain not verified' }), { status: 403 }));
    const { service, updates } = setup({ 'email.provider': 'resend', 'email.resend.apiKey': 'k' });

    await expect(service.send(input)).resolves.toEqual({ id: 'log1', sent: false });
    expect(updates[0]).toMatchObject({ status: 'failed', error: 'Resend 403: domain not verified' });
  });

  it('fails clearly when Resend is chosen without an API key', async () => {
    const { service, updates } = setup({ 'email.provider': 'resend' });
    await service.send(input);
    expect(updates[0]).toMatchObject({ status: 'failed', error: 'RESEND_API_KEY is not set' });
  });

  it('logs in to SMTP with SMTP_USER/SMTP_PASS (e.g. Gmail App Password)', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: '<m1>' });
    (createTransport as jest.Mock).mockReturnValue({ sendMail });
    const { service, updates } = setup({
      'email.provider': 'smtp',
      'email.smtp.host': 'smtp.gmail.com',
      'email.smtp.port': 587,
      'email.smtp.secure': false,
      'email.smtp.user': 'me@gmail.com',
      'email.smtp.pass': 'apppassword',
    });

    await service.send(input);

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: 'me@gmail.com', pass: 'apppassword' },
      }),
    );
    expect(updates[0]).toMatchObject({ status: 'sent', providerId: '<m1>' });
  });
});

describe('describeError', () => {
  it('expands an AggregateError instead of returning an empty string', () => {
    const a = Object.assign(new Error('connect ECONNREFUSED ::1:1025'), { code: 'ECONNREFUSED' });
    const b = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:1025'), { code: 'ECONNREFUSED' });
    const msg = describeError(new AggregateError([a, b], ''));
    expect(msg).toContain('127.0.0.1:1025');
    expect(msg).not.toBe('');
  });
});

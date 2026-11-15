import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async notifyInApp(
    companyId: string,
    userId: string,
    title: string,
    body: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.notification.create({
      data: {
        companyId,
        userId,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.PENDING,
        title,
        body,
        metadata: (metadata ?? {}) as object,
      },
    });
  }

  async sendCandidateInvite(params: {
    companyId: string;
    to: string;
    companyName: string;
    loginUrl: string;
    tempPassword?: string;
    deadlineIso: string;
    primaryColor: string;
  }) {
    const html = `<div style="font-family:sans-serif;border-left:4px solid ${params.primaryColor};padding:16px">
      <h2>${params.companyName} — Interview invitation</h2>
      <p>Complete your interview before <strong>${params.deadlineIso}</strong>.</p>
      <p><a href="${params.loginUrl}">Start interview</a></p>
      ${params.tempPassword ? `<p>Temporary password: <code>${params.tempPassword}</code></p>` : ''}
    </div>`;
    return this.email.send({
      companyId: params.companyId,
      to: params.to,
      subject: `${params.companyName}: Your interview invitation`,
      template: 'candidate_invite',
      html,
    });
  }

  async sendInterviewReminder(params: {
    companyId: string;
    to: string;
    companyName: string;
    hoursLeft: number;
    loginUrl: string;
  }) {
    const template =
      params.hoursLeft <= 4 ? 'interview_reminder_4h' : 'interview_reminder_24h';
    return this.email.send({
      companyId: params.companyId,
      to: params.to,
      subject: `${params.companyName}: Interview in ${params.hoursLeft}h`,
      template,
      html: `<p>Reminder: your interview window closes soon. <a href="${params.loginUrl}">Continue</a></p>`,
    });
  }

  sendPasswordReset(params: { companyId: string; to: string; resetUrl: string }) {
    return this.email.send({
      companyId: params.companyId,
      to: params.to,
      subject: 'Reset your HireMind password',
      template: 'password_reset',
      html: `<p>We received a request to reset your password.</p>
      <p><a href="${params.resetUrl}">Choose a new password</a> — this link expires in 1 hour.</p>
      <p>If you didn't ask for this, you can ignore this email.</p>`,
    });
  }

  sendStaffInvite(params: {
    companyId: string;
    to: string;
    companyName: string;
    role: string;
    acceptUrl: string;
  }) {
    return this.email.send({
      companyId: params.companyId,
      to: params.to,
      subject: `You're invited to ${params.companyName} on HireMind`,
      template: 'staff_invite',
      html: `<p>You've been invited to join <strong>${params.companyName}</strong> as ${params.role.toLowerCase()}.</p>
      <p><a href="${params.acceptUrl}">Accept invite and set your password</a> — valid for 7 days.</p>`,
    });
  }
}

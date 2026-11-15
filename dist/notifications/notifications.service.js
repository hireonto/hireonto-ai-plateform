"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("./email.service");
let NotificationsService = class NotificationsService {
    constructor(prisma, email) {
        this.prisma = prisma;
        this.email = email;
    }
    async notifyInApp(companyId, userId, title, body, metadata) {
        return this.prisma.notification.create({
            data: {
                companyId,
                userId,
                channel: client_1.NotificationChannel.IN_APP,
                status: client_1.NotificationStatus.PENDING,
                title,
                body,
                metadata: (metadata ?? {}),
            },
        });
    }
    async sendCandidateInvite(params) {
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
    async sendInterviewReminder(params) {
        const template = params.hoursLeft <= 4 ? 'interview_reminder_4h' : 'interview_reminder_24h';
        return this.email.send({
            companyId: params.companyId,
            to: params.to,
            subject: `${params.companyName}: Interview in ${params.hoursLeft}h`,
            template,
            html: `<p>Reminder: your interview window closes soon. <a href="${params.loginUrl}">Continue</a></p>`,
        });
    }
    sendPasswordReset(params) {
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
    sendStaffInvite(params) {
        return this.email.send({
            companyId: params.companyId,
            to: params.to,
            subject: `You're invited to ${params.companyName} on HireMind`,
            template: 'staff_invite',
            html: `<p>You've been invited to join <strong>${params.companyName}</strong> as ${params.role.toLowerCase()}.</p>
      <p><a href="${params.acceptUrl}">Accept invite and set your password</a> — valid for 7 days.</p>`,
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map
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
exports.SchedulingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../notifications/email.service");
const calendar_service_1 = require("./calendar.service");
const plan_features_service_1 = require("./plan-features.service");
const pstn_service_1 = require("./pstn.service");
let SchedulingService = class SchedulingService {
    constructor(prisma, planFeatures, email, calendar, config, pstn) {
        this.prisma = prisma;
        this.planFeatures = planFeatures;
        this.email = email;
        this.calendar = calendar;
        this.config = config;
        this.pstn = pstn;
    }
    async startCallCampaign(companyId, jobId, createdById, candidateJobIds, promptTemplate) {
        await this.planFeatures.require(companyId, 'pstn_outbound');
        if (!promptTemplate.trim())
            throw new common_1.BadRequestException('Prompt is required');
        const rows = await this.prisma.candidateJob.findMany({
            where: {
                id: { in: candidateJobIds },
                companyId,
                jobId,
                status: client_1.CandidateJobStatus.SHORTLISTED,
                deletedAt: null,
            },
            include: { candidate: true },
        });
        if (!rows.length)
            throw new common_1.BadRequestException('No shortlisted candidates selected');
        const campaign = await this.prisma.outboundCallCampaign.create({
            data: {
                companyId,
                jobId,
                createdById,
                promptTemplate,
                status: client_1.OutboundCampaignStatus.RUNNING,
                calls: {
                    create: rows.map((r) => ({
                        candidateJobId: r.id,
                        phone: r.candidate.phone ?? undefined,
                        status: client_1.OutboundCallStatus.QUEUED,
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
            }
            else if (this.pstn.isConfigured()) {
            }
            else {
                await this.simulateOutboundCall(companyId, jobId, call.id, promptTemplate);
                simulated++;
            }
        }
        const finalStatus = twilio > 0 && simulated === 0
            ? client_1.OutboundCampaignStatus.RUNNING
            : client_1.OutboundCampaignStatus.COMPLETED;
        await this.prisma.outboundCallCampaign.update({
            where: { id: campaign.id },
            data: { status: finalStatus },
        });
        return { campaignId: campaign.id, calls: campaign.calls.length, twilio, simulated };
    }
    async simulateOutboundCall(companyId, jobId, callId, prompt) {
        const call = await this.prisma.outboundCall.findUnique({
            where: { id: callId },
            include: { candidateJob: { include: { candidate: true, job: true } } },
        });
        if (!call?.candidateJob)
            return;
        const proposed = new Date(Date.now() + 48 * 3600_000);
        await this.prisma.outboundCall.update({
            where: { id: callId },
            data: {
                status: client_1.OutboundCallStatus.SCHEDULED,
                proposedSlot: proposed,
                transcript: `[PSTN stub] Prompt: ${prompt.slice(0, 200)}… Candidate agreed to ${proposed.toISOString()}`,
            },
        });
        await this.confirmSchedule(companyId, call.candidateJobId, jobId, proposed, call.candidateJob.candidate.email);
    }
    async confirmSchedule(companyId, candidateJobId, jobId, scheduledAt, emailTo) {
        await this.planFeatures.require(companyId, 'calendar_sync');
        const cj = await this.prisma.candidateJob.findFirst({
            where: { id: candidateJobId, companyId, jobId },
            include: { candidate: true, job: true },
        });
        if (!cj)
            throw new common_1.NotFoundException('Candidate job not found');
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
                accessToken: (0, crypto_1.randomBytes)(16).toString('hex'),
                status: client_1.InterviewScheduleStatus.CONFIRMED,
            },
        });
        await this.prisma.candidateJob.update({
            where: { id: candidateJobId },
            data: { status: client_1.CandidateJobStatus.INTERVIEW_SCHEDULED },
        });
        const to = cj.candidate.email ?? emailTo;
        if (to) {
            const appUrl = this.config.get('appUrl') ?? 'http://localhost:3000';
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
    async maybeCompleteCampaignForCall(callId) {
        const call = await this.prisma.outboundCall.findUnique({
            where: { id: callId },
            include: { campaign: { include: { calls: true } } },
        });
        if (!call?.campaign)
            return;
        const terminal = [
            client_1.OutboundCallStatus.SCHEDULED,
            client_1.OutboundCallStatus.FAILED,
            client_1.OutboundCallStatus.NO_ANSWER,
            client_1.OutboundCallStatus.COMPLETED,
        ];
        const allDone = call.campaign.calls.every((c) => terminal.includes(c.status));
        if (allDone) {
            await this.prisma.outboundCallCampaign.update({
                where: { id: call.campaign.id },
                data: { status: client_1.OutboundCampaignStatus.COMPLETED },
            });
        }
    }
};
exports.SchedulingService = SchedulingService;
exports.SchedulingService = SchedulingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        plan_features_service_1.PlanFeaturesService,
        email_service_1.EmailService,
        calendar_service_1.CalendarService,
        config_1.ConfigService,
        pstn_service_1.PstnService])
], SchedulingService);
//# sourceMappingURL=scheduling.service.js.map
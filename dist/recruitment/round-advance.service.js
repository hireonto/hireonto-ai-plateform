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
var RoundAdvanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoundAdvanceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const email_service_1 = require("../notifications/email.service");
const prisma_service_1 = require("../prisma/prisma.service");
const calendar_service_1 = require("./calendar.service");
const rounds_service_1 = require("./rounds.service");
let RoundAdvanceService = RoundAdvanceService_1 = class RoundAdvanceService {
    constructor(prisma, rounds, calendar, email, config) {
        this.prisma = prisma;
        this.rounds = rounds;
        this.calendar = calendar;
        this.email = email;
        this.config = config;
        this.logger = new common_1.Logger(RoundAdvanceService_1.name);
    }
    async afterInterviewCompleted(interviewId) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                job: { include: { company: true } },
                candidate: true,
                jobRound: true,
            },
        });
        if (!interview)
            return;
        const cj = await this.prisma.candidateJob.findUnique({
            where: { candidateId_jobId: { candidateId: interview.candidateId, jobId: interview.jobId } },
        });
        if (!cj)
            return;
        await this.rounds.ensureDefaults(interview.jobId);
        const jobRounds = await this.prisma.jobRound.findMany({
            where: { jobId: interview.jobId },
            orderBy: { orderIndex: 'asc' },
        });
        if (jobRounds.length <= 1)
            return;
        const completedIndex = interview.jobRound?.orderIndex ??
            jobRounds.find((r) => r.conductor === client_1.RoundConductor.AI)?.orderIndex ??
            cj.currentRoundIndex;
        const nextIndex = completedIndex + 1;
        const nextRound = jobRounds.find((r) => r.orderIndex === nextIndex);
        if (!nextRound) {
            await this.prisma.candidateJob.update({
                where: { id: cj.id },
                data: { currentRoundIndex: completedIndex, status: client_1.CandidateJobStatus.INTERVIEW_COMPLETED },
            });
            return;
        }
        await this.prisma.candidateJob.update({
            where: { id: cj.id },
            data: { currentRoundIndex: nextIndex },
        });
        const appUrl = this.config.get('appUrl') ?? 'http://localhost:3000';
        const candidateName = [interview.candidate.firstName, interview.candidate.lastName].filter(Boolean).join(' ') || 'there';
        const to = interview.candidate.email;
        if (nextRound.conductor === client_1.RoundConductor.HUMAN) {
            const scheduledAt = new Date(Date.now() + 72 * 3600_000);
            const meet = await this.calendar.createInterviewEvent(interview.companyId, {
                title: `${nextRound.label} — ${interview.job.title}`,
                scheduledAt,
                attendeeEmail: to ?? undefined,
            });
            const accessToken = (0, crypto_1.randomBytes)(16).toString('hex');
            await this.prisma.interviewSchedule.create({
                data: {
                    companyId: interview.companyId,
                    candidateJobId: cj.id,
                    jobId: interview.jobId,
                    jobRoundId: nextRound.id,
                    scheduledAt,
                    meetProvider: meet.provider,
                    meetUrl: meet.url,
                    calendarEventId: meet.eventId,
                    accessToken,
                    status: client_1.InterviewScheduleStatus.CONFIRMED,
                },
            });
            await this.prisma.candidateJob.update({
                where: { id: cj.id },
                data: { status: client_1.CandidateJobStatus.INTERVIEW_SCHEDULED },
            });
            if (to) {
                await this.email.send({
                    companyId: interview.companyId,
                    to,
                    subject: `Next round: ${nextRound.label}`,
                    template: 'round_advance_human',
                    html: `<p>Hi ${candidateName},</p>
<p>You completed the previous round for <b>${interview.job.title}</b>. Your next step is <b>${nextRound.label}</b>.</p>
<p>Join at ${scheduledAt.toLocaleString()}: <a href="${meet.url}">${meet.url}</a></p>
<p>Or open your interview room: <a href="${appUrl}/candidate/meet/${accessToken}">${appUrl}/candidate/meet/${accessToken}</a></p>`,
                    metadata: { candidateJobId: cj.id, roundId: nextRound.id },
                });
            }
            return;
        }
        await this.prisma.candidateJob.update({
            where: { id: cj.id },
            data: { status: client_1.CandidateJobStatus.SHORTLISTED },
        });
        if (to) {
            await this.email.send({
                companyId: interview.companyId,
                to,
                subject: `Next step: ${nextRound.label}`,
                template: 'round_advance_ai',
                html: `<p>Hi ${candidateName},</p>
<p>Thank you for completing your interview for <b>${interview.job.title}</b>.</p>
<p>The hiring team will send you an invite for <b>${nextRound.label}</b> shortly.</p>`,
                metadata: { candidateJobId: cj.id, roundId: nextRound.id },
            });
        }
        this.logger.log(`Advanced ${cj.id} to round ${nextIndex} (${nextRound.label})`);
    }
};
exports.RoundAdvanceService = RoundAdvanceService;
exports.RoundAdvanceService = RoundAdvanceService = RoundAdvanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rounds_service_1.RoundsService,
        calendar_service_1.CalendarService,
        email_service_1.EmailService,
        config_1.ConfigService])
], RoundAdvanceService);
//# sourceMappingURL=round-advance.service.js.map
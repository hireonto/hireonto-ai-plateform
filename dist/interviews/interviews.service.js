"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const bullmq_2 = require("bullmq");
const crypto_1 = require("crypto");
const notifications_service_1 = require("../notifications/notifications.service");
const prisma_service_1 = require("../prisma/prisma.service");
const interviews_constants_1 = require("./interviews.constants");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let InterviewsService = class InterviewsService {
    constructor(prisma, notifications, interviewQueue) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.interviewQueue = interviewQueue;
    }
    list(companyId, jobId) {
        return this.prisma.interview.findMany({
            where: {
                companyId,
                deletedAt: null,
                ...(jobId ? { jobId } : {}),
            },
            include: {
                candidate: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                job: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createFromShortlist(companyId, jobId, candidateJobIds, emails = {}) {
        const config = await this.prisma.jobInterviewConfig.findFirst({
            where: { job: { id: jobId, companyId } },
        });
        const windowHours = config?.windowHours ?? 72;
        const created = [];
        const skipped = [];
        for (const cjId of candidateJobIds) {
            const cj = await this.prisma.candidateJob.findFirst({
                where: {
                    id: cjId,
                    companyId,
                    jobId,
                    status: client_1.CandidateJobStatus.SHORTLISTED,
                    deletedAt: null,
                },
                include: { candidate: true, job: { include: { company: true } } },
            });
            if (!cj) {
                skipped.push({ candidateJobId: cjId, reason: 'Not shortlisted' });
                continue;
            }
            let to = cj.candidate.email;
            if (emails[cjId]?.trim()) {
                try {
                    to = await this.setCandidateEmail(companyId, cj.candidateId, emails[cjId]);
                }
                catch (err) {
                    skipped.push({ candidateJobId: cjId, reason: err.message });
                    continue;
                }
            }
            if (!to) {
                skipped.push({ candidateJobId: cjId, reason: 'No email address' });
                continue;
            }
            const windowEnd = new Date(Date.now() + windowHours * 3600 * 1000);
            const accessToken = randomBytes24();
            const tempPassword = (0, crypto_1.randomBytes)(4).toString('hex');
            const tempPasswordHash = await bcrypt.hash(tempPassword, 12);
            const aiRound = await this.prisma.jobRound.findFirst({
                where: { jobId, conductor: client_1.RoundConductor.AI },
                orderBy: { orderIndex: 'asc' },
            });
            const interview = await this.prisma.interview.create({
                data: {
                    companyId,
                    jobId,
                    candidateId: cj.candidateId,
                    status: client_1.InterviewStatus.INVITED,
                    windowEnd,
                    accessToken,
                    jobRoundId: aiRound?.id,
                },
            });
            if (aiRound) {
                await this.prisma.candidateJob.update({
                    where: { id: cj.id },
                    data: { currentRoundIndex: aiRound.orderIndex },
                });
            }
            await this.prisma.candidate.update({
                where: { id: cj.candidateId },
                data: { tempPasswordHash },
            });
            await this.prisma.candidateJob.update({
                where: { id: cj.id },
                data: { status: client_1.CandidateJobStatus.INTERVIEW_SCHEDULED },
            });
            await this.scheduleJobs(interview.id, windowEnd);
            const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
            const mail = await this.notifications.sendCandidateInvite({
                companyId,
                to,
                companyName: cj.job.company.name,
                loginUrl: `${appUrl}/candidate/interview/${accessToken}`,
                tempPassword,
                deadlineIso: windowEnd.toISOString(),
                primaryColor: cj.job.company.primaryColor ?? '#2563eb',
            });
            created.push({ interviewId: interview.id, candidateJobId: cj.id, email: to, emailSent: mail.sent });
        }
        return { created, skipped };
    }
    async setCandidateEmail(companyId, candidateId, raw) {
        const email = raw.trim().toLowerCase();
        if (!EMAIL_RE.test(email)) {
            throw new common_1.BadRequestException(`"${raw}" is not a valid email`);
        }
        const taken = await this.prisma.candidate.findFirst({
            where: { companyId, email, id: { not: candidateId }, deletedAt: null },
            select: { id: true },
        });
        if (taken) {
            throw new common_1.BadRequestException(`${email} already belongs to another candidate`);
        }
        await this.prisma.candidate.update({ where: { id: candidateId }, data: { email } });
        return email;
    }
    async extend(companyId, interviewId, extraHours) {
        const interview = await this.get(companyId, interviewId);
        if (interview.status === client_1.InterviewStatus.COMPLETED) {
            throw new common_1.BadRequestException('Interview already completed');
        }
        const windowEnd = new Date(interview.windowEnd.getTime() + extraHours * 3600 * 1000);
        const updated = await this.prisma.interview.update({
            where: { id: interviewId },
            data: { windowEnd, status: client_1.InterviewStatus.INVITED },
        });
        await this.scheduleJobs(interviewId, windowEnd);
        return updated;
    }
    async cancel(companyId, interviewId) {
        await this.get(companyId, interviewId);
        return this.prisma.interview.update({
            where: { id: interviewId },
            data: { status: client_1.InterviewStatus.CANCELLED },
        });
    }
    async resendInvite(companyId, interviewId, email) {
        const interview = await this.prisma.interview.findFirst({
            where: { id: interviewId, companyId, deletedAt: null },
            include: {
                candidate: true,
                company: true,
                job: true,
            },
        });
        if (!interview) {
            throw new common_1.BadRequestException('Interview not found');
        }
        const to = email?.trim()
            ? await this.setCandidateEmail(companyId, interview.candidateId, email)
            : interview.candidate.email;
        if (!to) {
            throw new common_1.BadRequestException('Candidate email missing — enter one to send the invite');
        }
        const tempPassword = (0, crypto_1.randomBytes)(4).toString('hex');
        await this.prisma.candidate.update({
            where: { id: interview.candidateId },
            data: { tempPasswordHash: await bcrypt.hash(tempPassword, 12) },
        });
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        const mail = await this.notifications.sendCandidateInvite({
            companyId,
            to,
            companyName: interview.company.name,
            loginUrl: `${appUrl}/candidate/interview/${interview.accessToken}`,
            tempPassword,
            deadlineIso: interview.windowEnd.toISOString(),
            primaryColor: interview.company.primaryColor ?? '#2563eb',
        });
        return { resent: true, email: to, emailSent: mail.sent };
    }
    async get(companyId, interviewId) {
        const interview = await this.prisma.interview.findFirst({
            where: { id: interviewId, companyId, deletedAt: null },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        return interview;
    }
    async scheduleJobs(interviewId, windowEnd) {
        const msUntilEnd = windowEnd.getTime() - Date.now();
        const delay24 = msUntilEnd - 24 * 3600 * 1000;
        const delay4 = msUntilEnd - 4 * 3600 * 1000;
        if (delay24 > 0) {
            await this.interviewQueue.add('reminder-24', { type: 'reminder', interviewId, hoursLeft: 24 }, { delay: delay24, jobId: `${interviewId}-r24` });
        }
        if (delay4 > 0) {
            await this.interviewQueue.add('reminder-4', { type: 'reminder', interviewId, hoursLeft: 4 }, { delay: delay4, jobId: `${interviewId}-r4` });
        }
        await this.interviewQueue.add('expire', { type: 'expire', interviewId }, { delay: Math.max(msUntilEnd, 0), jobId: `${interviewId}-expire` });
    }
};
exports.InterviewsService = InterviewsService;
exports.InterviewsService = InterviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)(interviews_constants_1.INTERVIEW_JOBS_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        bullmq_2.Queue])
], InterviewsService);
function randomBytes24() {
    return (0, crypto_1.randomBytes)(24).toString('hex');
}
//# sourceMappingURL=interviews.service.js.map
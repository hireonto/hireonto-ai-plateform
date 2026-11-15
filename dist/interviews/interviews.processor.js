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
var InterviewsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewsProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
const prisma_service_1 = require("../prisma/prisma.service");
const interviews_constants_1 = require("./interviews.constants");
let InterviewsProcessor = InterviewsProcessor_1 = class InterviewsProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, notifications) {
        super();
        this.prisma = prisma;
        this.notifications = notifications;
        this.logger = new common_1.Logger(InterviewsProcessor_1.name);
    }
    async process(job) {
        const data = job.data;
        if (data.type === 'expire') {
            return this.expire(data.interviewId);
        }
        return this.reminder(data.interviewId, data.hoursLeft);
    }
    async expire(interviewId) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
        });
        if (!interview || interview.status === client_1.InterviewStatus.COMPLETED) {
            return { skipped: true };
        }
        if (interview.windowEnd > new Date()) {
            return { skipped: true, reason: 'not_yet_due' };
        }
        await this.prisma.interview.update({
            where: { id: interviewId },
            data: { status: client_1.InterviewStatus.EXPIRED },
        });
        return { expired: true };
    }
    async reminder(interviewId, hoursLeft) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                candidate: true,
                company: true,
            },
        });
        if (!interview?.candidate?.email ||
            interview.status === client_1.InterviewStatus.COMPLETED ||
            interview.status === client_1.InterviewStatus.EXPIRED) {
            return { skipped: true };
        }
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        await this.notifications.sendInterviewReminder({
            companyId: interview.companyId,
            to: interview.candidate.email,
            companyName: interview.company.name,
            hoursLeft,
            loginUrl: `${appUrl}/candidate/interview/${interview.accessToken}`,
        });
        this.logger.log(`Reminder T-${hoursLeft}h sent for ${interviewId}`);
        return { sent: true };
    }
};
exports.InterviewsProcessor = InterviewsProcessor;
exports.InterviewsProcessor = InterviewsProcessor = InterviewsProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(interviews_constants_1.INTERVIEW_JOBS_QUEUE),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], InterviewsProcessor);
//# sourceMappingURL=interviews.processor.js.map
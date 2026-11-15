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
exports.InterviewContextService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let InterviewContextService = class InterviewContextService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async context(interviewId) {
        const interview = await this.prisma.interview.findFirst({
            where: { id: interviewId, deletedAt: null },
            include: {
                company: { select: { name: true } },
                job: {
                    include: {
                        interviewConfig: true,
                        questionBanks: { where: { deletedAt: null }, select: { storageKey: true } },
                    },
                },
                candidate: {
                    include: {
                        resumes: {
                            where: { deletedAt: null, parsedText: { not: null } },
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        const c = interview.candidate;
        const cfg = interview.job.interviewConfig;
        return {
            interview_id: interview.id,
            candidate_name: [c.firstName, c.lastName].filter(Boolean).join(' ') || 'the candidate',
            company_name: interview.company.name,
            job_title: interview.job.title,
            job_description: interview.job.description ?? '',
            resume_text: c.resumes[0]?.parsedText ?? '',
            question_count: cfg?.questionCount ?? 5,
            duration_minutes: cfg?.durationMinutes ?? 30,
            coding_enabled: cfg?.codingEnabled ?? false,
            jd_document_key: interview.job.jdStorageKey,
            question_bank_keys: interview.job.questionBanks.map((q) => q.storageKey),
            question_plan: await this.plan(interviewId),
        };
    }
    async plan(interviewId) {
        const run = await this.prisma.aiRun.findFirst({
            where: { interviewId, operation: 'interview_plan', status: client_1.AiRunStatus.SUCCEEDED },
            orderBy: { createdAt: 'desc' },
        });
        const summary = run?.responseSummary;
        return summary?.questions ?? [];
    }
    async transcript(interviewId) {
        const questions = await this.prisma.interviewQuestion.findMany({
            where: { interviewId },
            orderBy: { orderIndex: 'asc' },
            include: { answers: { orderBy: { createdAt: 'asc' } } },
        });
        const turns = [];
        for (const q of questions) {
            turns.push({ role: 'interviewer', text: q.questionText });
            for (const a of q.answers) {
                const text = a.transcript ?? a.text ?? a.code;
                if (text)
                    turns.push({ role: 'candidate', text });
            }
        }
        return turns;
    }
};
exports.InterviewContextService = InterviewContextService;
exports.InterviewContextService = InterviewContextService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InterviewContextService);
//# sourceMappingURL=interview-context.service.js.map
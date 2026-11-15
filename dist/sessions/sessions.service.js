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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const round_advance_service_1 = require("../recruitment/round-advance.service");
const RECONNECT_WINDOW_MS = 5 * 60 * 1000;
let SessionsService = class SessionsService {
    constructor(prisma, jwt, config, roundAdvance) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.roundAdvance = roundAdvance;
    }
    async start(interviewId, candidateId) {
        const interview = await this.getCandidateInterview(interviewId, candidateId);
        this.assertWindowOpen(interview);
        if (interview.status === client_1.InterviewStatus.COMPLETED ||
            interview.status === client_1.InterviewStatus.TERMINATED ||
            interview.status === client_1.InterviewStatus.EXPIRED) {
            throw new common_1.BadRequestException('Interview not active');
        }
        const existingQuestions = await this.prisma.interviewQuestion.count({
            where: { interviewId },
        });
        if (existingQuestions === 0) {
            const config = await this.prisma.jobInterviewConfig.findFirst({
                where: { jobId: interview.jobId },
            });
            const count = config?.questionCount ?? 5;
            const seeds = this.fakeQuestions(count);
            for (let i = 0; i < seeds.length; i++) {
                await this.prisma.interviewQuestion.create({
                    data: {
                        interviewId,
                        orderIndex: i,
                        questionText: seeds[i],
                        questionType: i === count - 1 && config?.codingEnabled ? 'coding' : 'behavioral',
                        timeLimitSec: 180,
                    },
                });
            }
        }
        await this.prisma.interview.update({
            where: { id: interviewId },
            data: {
                status: client_1.InterviewStatus.IN_PROGRESS,
                startedAt: interview.startedAt ?? new Date(),
            },
        });
        await this.prisma.candidateJob.updateMany({
            where: {
                candidateId,
                jobId: interview.jobId,
            },
            data: { status: 'INTERVIEW_IN_PROGRESS' },
        });
        return this.nextQuestion(interviewId, candidateId);
    }
    async nextQuestion(interviewId, candidateId) {
        const interview = await this.getCandidateInterview(interviewId, candidateId);
        this.assertInProgress(interview);
        const answered = await this.prisma.interviewQuestion.findMany({
            where: {
                interviewId,
                answers: { some: { submittedAt: { not: null } } },
            },
            select: { id: true },
        });
        const answeredIds = new Set(answered.map((q) => q.id));
        const pending = await this.prisma.interviewQuestion.findMany({
            where: { interviewId },
            orderBy: { orderIndex: 'asc' },
        });
        const question = pending.find((q) => !answeredIds.has(q.id));
        if (!question) {
            return { done: true };
        }
        return {
            done: false,
            question: {
                id: question.id,
                orderIndex: question.orderIndex,
                questionText: question.questionText,
                questionType: question.questionType,
                timeLimitSec: question.timeLimitSec,
            },
            interviewEndsAt: interview.windowEnd,
        };
    }
    async submitAnswer(interviewId, candidateId, questionId, body) {
        const interview = await this.getCandidateInterview(interviewId, candidateId);
        this.assertInProgress(interview);
        this.assertWithinTimeLimit(interview);
        const question = await this.prisma.interviewQuestion.findFirst({
            where: { id: questionId, interviewId },
        });
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        const answer = await this.prisma.answer.create({
            data: {
                interviewQuestionId: questionId,
                text: body.text,
                transcript: body.transcript,
                code: body.code,
                audioUrl: body.audioUrl,
                submittedAt: new Date(),
                score: this.config.get('ai.fakeMode') ? 0.8 : undefined,
                aiReasoning: this.config.get('ai.fakeMode')
                    ? 'FAKE_MODE: coherent answer'
                    : undefined,
            },
        });
        if (body.transcript) {
            await this.prisma.transcriptSegment.create({
                data: {
                    answerId: answer.id,
                    segmentIndex: 0,
                    text: body.transcript,
                    isFinal: true,
                },
            });
        }
        return { answerId: answer.id };
    }
    async requestFollowUp(interviewId, candidateId, questionId) {
        const interview = await this.getCandidateInterview(interviewId, candidateId);
        this.assertInProgress(interview);
        const config = await this.prisma.jobInterviewConfig.findFirst({
            where: { jobId: interview.jobId },
        });
        const maxFollowUps = config?.maxFollowUps ?? 2;
        const followUpCount = await this.prisma.interviewQuestion.count({
            where: { interviewId, isFollowUp: true },
        });
        if (followUpCount >= maxFollowUps) {
            throw new common_1.BadRequestException('Follow-up limit reached');
        }
        const parent = await this.prisma.interviewQuestion.findFirst({
            where: { id: questionId, interviewId },
        });
        if (!parent) {
            throw new common_1.NotFoundException('Question not found');
        }
        const orderIndex = (await this.prisma.interviewQuestion.count({ where: { interviewId } })) +
            1;
        const followUp = await this.prisma.interviewQuestion.create({
            data: {
                interviewId,
                orderIndex,
                questionText: `Follow-up: Can you elaborate on your approach for question ${parent.orderIndex + 1}?`,
                questionType: 'behavioral',
                timeLimitSec: 120,
                isFollowUp: true,
                parentQuestionId: questionId,
            },
        });
        return { question: followUp };
    }
    async reconnect(interviewId, candidateId) {
        const interview = await this.getCandidateInterview(interviewId, candidateId);
        if (interview.status !== client_1.InterviewStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Interview not in progress');
        }
        if (interview.reconnectUsedAt) {
            const elapsed = Date.now() - interview.reconnectUsedAt.getTime();
            if (elapsed > RECONNECT_WINDOW_MS) {
                throw new common_1.ForbiddenException('Reconnect already used');
            }
        }
        await this.prisma.interview.update({
            where: { id: interviewId },
            data: { reconnectUsedAt: new Date() },
        });
        return { reconnected: true, next: await this.nextQuestion(interviewId, candidateId) };
    }
    async finish(interviewId, candidateId) {
        const interview = await this.getCandidateInterview(interviewId, candidateId);
        await this.prisma.interview.update({
            where: { id: interviewId },
            data: {
                status: client_1.InterviewStatus.COMPLETED,
                finishedAt: new Date(),
            },
        });
        await this.prisma.candidateJob.updateMany({
            where: { candidateId, jobId: interview.jobId },
            data: { status: 'INTERVIEW_COMPLETED' },
        });
        await this.roundAdvance.afterInterviewCompleted(interviewId).catch(() => undefined);
        return { completed: true };
    }
    async sttToken(interviewId, candidateId) {
        await this.getCandidateInterview(interviewId, candidateId);
        const token = await this.jwt.signAsync({ sub: candidateId, interviewId, aud: 'stt' }, {
            secret: this.config.get('jwt.internalSecret'),
            expiresIn: '2m',
        });
        const base = this.config.get('appUrl') ?? 'http://localhost:3001';
        return {
            token,
            wsUrl: `${base.replace(/^http/, 'ws')}/ai/stt/stream`,
            expiresIn: 120,
        };
    }
    async getCandidateInterview(interviewId, candidateId) {
        const interview = await this.prisma.interview.findFirst({
            where: { id: interviewId, candidateId, deletedAt: null },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        return interview;
    }
    assertWindowOpen(interview) {
        if (interview.windowEnd < new Date()) {
            throw new common_1.BadRequestException('Interview window expired');
        }
    }
    assertInProgress(interview) {
        this.assertWindowOpen(interview);
        if (interview.status !== client_1.InterviewStatus.IN_PROGRESS &&
            interview.status !== client_1.InterviewStatus.INVITED) {
            throw new common_1.BadRequestException('Interview not in progress');
        }
    }
    assertWithinTimeLimit(interview) {
        if (interview.windowEnd < new Date()) {
            throw new common_1.BadRequestException('Time limit exceeded');
        }
    }
    fakeQuestions(count) {
        const bank = [
            'Describe a scalable API you built with Node.js.',
            'How do you handle database migrations in production?',
            'Explain your approach to caching with Redis.',
            'Tell us about debugging a production incident.',
            'How would you design multi-tenant auth?',
            'Describe testing strategy for a NestJS service.',
        ];
        return bank.slice(0, count);
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        round_advance_service_1.RoundAdvanceService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map
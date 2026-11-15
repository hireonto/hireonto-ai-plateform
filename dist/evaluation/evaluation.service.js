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
exports.EvaluationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const ai_client_service_1 = require("../ai-client/ai-client.service");
const interview_context_service_1 = require("../ai-client/interview-context.service");
const prisma_service_1 = require("../prisma/prisma.service");
let EvaluationService = class EvaluationService {
    constructor(prisma, ai, interviewContext, config) {
        this.prisma = prisma;
        this.ai = ai;
        this.interviewContext = interviewContext;
        this.config = config;
    }
    async trigger(interviewId, companyId) {
        const interview = await this.prisma.interview.findFirst({
            where: { id: interviewId, companyId, deletedAt: null },
            include: {
                questions: { include: { answers: true } },
                proctoringEvents: true,
            },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        const run = await this.prisma.aiRun.create({
            data: {
                companyId,
                interviewId,
                operation: 'full_evaluation',
                status: client_1.AiRunStatus.RUNNING,
                requestPayload: { interviewId },
            },
        });
        let report;
        try {
            report = await this.evaluate(interviewId, companyId);
        }
        catch (err) {
            await this.prisma.aiRun.update({
                where: { id: run.id },
                data: { status: client_1.AiRunStatus.FAILED, error: String(err) },
            });
            throw err;
        }
        await this.prisma.aiRun.update({
            where: { id: run.id },
            data: {
                status: client_1.AiRunStatus.SUCCEEDED,
                responseSummary: report,
                externalId: run.id,
            },
        });
        await this.prisma.evaluationReport.upsert({
            where: { interviewId },
            create: {
                interviewId,
                overallScore: report.overallScore,
                recommendation: report.recommendation,
                summary: report.summary,
                details: report.details,
            },
            update: {
                overallScore: report.overallScore,
                recommendation: report.recommendation,
                summary: report.summary,
                details: report.details,
            },
        });
        return { runId: run.id, report };
    }
    getReport(companyId, interviewId) {
        return this.prisma.evaluationReport.findFirst({
            where: { interview: { id: interviewId, companyId } },
        });
    }
    async override(companyId, interviewId, body) {
        const report = await this.getReport(companyId, interviewId);
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        return this.prisma.evaluationReport.update({
            where: { id: report.id },
            data: {
                finalDecision: body.finalDecision,
                humanOverride: {
                    ...(body.humanOverride ?? {}),
                    ...(body.overrideScore != null
                        ? { overrideScore: body.overrideScore }
                        : {}),
                },
            },
        });
    }
    async evaluate(interviewId, companyId) {
        if (this.config.get('ai.fakeMode')) {
            return this.fakeEvaluation(interviewId);
        }
        const [context, transcript, events] = await Promise.all([
            this.interviewContext.context(interviewId),
            this.interviewContext.transcript(interviewId),
            this.prisma.proctoringEvent.findMany({
                where: { interviewId, eventType: { in: ['AI_SUSPECTED_READING', 'PASTE'] } },
                select: { eventType: true },
            }),
        ]);
        const result = await this.ai.evaluateInterview(companyId, context, transcript, events.map((e) => e.eventType));
        return {
            interviewId,
            overallScore: result.overallScore,
            recommendation: result.recommendation,
            summary: result.summary,
            details: {
                dimensions: result.dimensions,
                evidence: result.evidence,
                strengths: result.strengths,
                concerns: result.concerns,
                authenticity: result.authenticity,
            },
        };
    }
    fakeEvaluation(interviewId) {
        return {
            interviewId,
            overallScore: 0.78,
            recommendation: 'hire',
            summary: 'FAKE_MODE: Strong technical answers with minor proctoring flags.',
            details: { dimensions: { technical: 0.82, communication: 0.74 } },
        };
    }
};
exports.EvaluationService = EvaluationService;
exports.EvaluationService = EvaluationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_client_service_1.AiClientService,
        interview_context_service_1.InterviewContextService,
        config_1.ConfigService])
], EvaluationService);
//# sourceMappingURL=evaluation.service.js.map
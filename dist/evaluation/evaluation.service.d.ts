import { ConfigService } from '@nestjs/config';
import { AiClientService } from '../ai-client/ai-client.service';
import { InterviewContextService } from '../ai-client/interview-context.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class EvaluationService {
    private readonly prisma;
    private readonly ai;
    private readonly interviewContext;
    private readonly config;
    constructor(prisma: PrismaService, ai: AiClientService, interviewContext: InterviewContextService, config: ConfigService);
    trigger(interviewId: string, companyId: string): Promise<{
        runId: string;
        report: {
            interviewId: string;
            overallScore: number;
            recommendation: string;
            summary: string;
            details: Record<string, unknown>;
        };
    }>;
    getReport(companyId: string, interviewId: string): import(".prisma/client").Prisma.Prisma__EvaluationReportClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        summary: string | null;
        interviewId: string;
        overallScore: number | null;
        recommendation: string | null;
        details: import("@prisma/client/runtime/library").JsonValue;
        humanOverride: import("@prisma/client/runtime/library").JsonValue | null;
        finalDecision: string | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    override(companyId: string, interviewId: string, body: {
        overrideScore?: number;
        finalDecision?: string;
        humanOverride?: Record<string, unknown>;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        summary: string | null;
        interviewId: string;
        overallScore: number | null;
        recommendation: string | null;
        details: import("@prisma/client/runtime/library").JsonValue;
        humanOverride: import("@prisma/client/runtime/library").JsonValue | null;
        finalDecision: string | null;
    }>;
    private evaluate;
    private fakeEvaluation;
}

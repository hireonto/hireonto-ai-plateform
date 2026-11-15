import { EvaluationService } from './evaluation.service';
export declare class EvaluationController {
    private readonly evaluation;
    constructor(evaluation: EvaluationService);
    trigger(companyId: string, interviewId: string): Promise<{
        runId: string;
        report: {
            interviewId: string;
            overallScore: number;
            recommendation: string;
            summary: string;
            details: Record<string, unknown>;
        };
    }>;
    get(companyId: string, interviewId: string): import(".prisma/client").Prisma.Prisma__EvaluationReportClient<{
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
}

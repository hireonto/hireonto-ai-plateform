import { Prisma, SourcingSource } from '@prisma/client';
import { AiClientService } from '../ai-client/ai-client.service';
import { CandidatesService } from '../candidates/candidates.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlanFeaturesService } from './plan-features.service';
export type IngestResumeDto = {
    source: SourcingSource;
    externalId?: string;
    fileName: string;
    resumeText: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
};
export declare class SourcingService {
    private readonly prisma;
    private readonly planFeatures;
    private readonly candidates;
    private readonly ai;
    constructor(prisma: PrismaService, planFeatures: PlanFeaturesService, candidates: CandidatesService, ai: AiClientService);
    getConfig(companyId: string, jobId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        jobId: string;
        enabled: boolean;
        sources: import(".prisma/client").$Enums.SourcingSource[];
        atsMinScore: number;
        nonAtsMaxPercent: number;
        searchKeywords: string | null;
        lastRunAt: Date | null;
        lastRunSummary: Prisma.JsonValue;
    }>;
    upsertConfig(companyId: string, jobId: string, data: {
        enabled?: boolean;
        sources?: SourcingSource[];
        atsMinScore?: number;
        nonAtsMaxPercent?: number;
        searchKeywords?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        jobId: string;
        enabled: boolean;
        sources: import(".prisma/client").$Enums.SourcingSource[];
        atsMinScore: number;
        nonAtsMaxPercent: number;
        searchKeywords: string | null;
        lastRunAt: Date | null;
        lastRunSummary: Prisma.JsonValue;
    }>;
    runAgent(companyId: string, jobId: string, payloads: IngestResumeDto[]): Promise<{
        ingested: number;
        skippedDup: number;
        skippedAts: number;
        nonAtsUsed: number;
        attempted: number;
        demo: boolean;
    }>;
    ingestOne(companyId: string, jobId: string, dto: IngestResumeDto): Promise<{
        ingested: number;
        skippedDup: number;
        skippedAts: number;
        nonAtsUsed: number;
        attempted: number;
        demo: boolean;
    }>;
    private demoExternalResumes;
    private assertJob;
}

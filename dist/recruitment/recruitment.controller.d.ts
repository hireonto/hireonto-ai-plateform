import { JobRoundType, MeetProvider, RecruitmentDecisionOutcome, RoundConductor, SourcingSource } from '@prisma/client';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { DecisionInviteService } from './decision-invite.service';
import { DecisionsService } from './decisions.service';
import { MeetAccessService } from './meet-access.service';
import { PlanFeaturesService } from './plan-features.service';
import { RoundsService } from './rounds.service';
import { SchedulingService } from './scheduling.service';
import { SourcingService, type IngestResumeDto } from './sourcing.service';
export declare class RecruitmentController {
    private readonly rounds;
    private readonly sourcing;
    private readonly scheduling;
    private readonly decisions;
    private readonly decisionInvites;
    private readonly meetAccess;
    private readonly planFeatures;
    constructor(rounds: RoundsService, sourcing: SourcingService, scheduling: SchedulingService, decisions: DecisionsService, decisionInvites: DecisionInviteService, meetAccess: MeetAccessService, planFeatures: PlanFeaturesService);
    planFeaturesForTenant(companyId: string): Promise<Record<import("./plan-features.service").PlanFeatureKey, boolean>>;
    getRounds(companyId: string, jobId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        jobId: string;
        durationMinutes: number;
        orderIndex: number;
        label: string;
        roundType: import(".prisma/client").$Enums.JobRoundType;
        conductor: import(".prisma/client").$Enums.RoundConductor;
        meetProvider: import(".prisma/client").$Enums.MeetProvider;
    }[]>;
    replaceRounds(companyId: string, jobId: string, body: {
        rounds: Array<{
            label: string;
            roundType: JobRoundType;
            conductor: RoundConductor;
            meetProvider?: MeetProvider;
            durationMinutes?: number;
        }>;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        jobId: string;
        durationMinutes: number;
        orderIndex: number;
        label: string;
        roundType: import(".prisma/client").$Enums.JobRoundType;
        conductor: import(".prisma/client").$Enums.RoundConductor;
        meetProvider: import(".prisma/client").$Enums.MeetProvider;
    }[]>;
    getSourcing(companyId: string, jobId: string): Promise<{
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
        lastRunSummary: import("@prisma/client/runtime/library").JsonValue;
    }>;
    patchSourcing(companyId: string, jobId: string, body: {
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
        lastRunSummary: import("@prisma/client/runtime/library").JsonValue;
    }>;
    ingestResume(companyId: string, jobId: string, body: IngestResumeDto): Promise<{
        ingested: number;
        skippedDup: number;
        skippedAts: number;
        nonAtsUsed: number;
        attempted: number;
        demo: boolean;
    }>;
    runSourcing(companyId: string, jobId: string, body: {
        resumes: IngestResumeDto[];
    }): Promise<{
        ingested: number;
        skippedDup: number;
        skippedAts: number;
        nonAtsUsed: number;
        attempted: number;
        demo: boolean;
    }>;
    callCampaign(companyId: string, jobId: string, user: JwtPayload, body: {
        candidateJobIds: string[];
        promptTemplate: string;
    }): Promise<{
        campaignId: string;
        calls: number;
        twilio: number;
        simulated: number;
    }>;
    submitDecision(companyId: string, candidateJobId: string, user: JwtPayload, body: {
        outcome: RecruitmentDecisionOutcome;
        reason?: string;
    }): Promise<{
        decision: {
            id: string;
            createdAt: Date;
            companyId: string;
            jobId: string;
            reason: string | null;
            candidateJobId: string;
            outcome: import(".prisma/client").$Enums.RecruitmentDecisionOutcome;
            decidedById: string | null;
            publicToken: string;
            candidateNotifiedAt: Date | null;
        };
        decisionUrl: string;
    }>;
    decisionByToken(token: string): Promise<{
        outcome: import(".prisma/client").$Enums.RecruitmentDecisionOutcome;
        reason: string | null;
        decidedAt: Date;
        candidate: {
            name: string;
            email: string | null;
        };
        job: {
            title: string;
            rounds: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                jobId: string;
                durationMinutes: number;
                orderIndex: number;
                label: string;
                roundType: import(".prisma/client").$Enums.JobRoundType;
                conductor: import(".prisma/client").$Enums.RoundConductor;
                meetProvider: import(".prisma/client").$Enums.MeetProvider;
            }[];
        };
    }>;
    createDecisionInvite(companyId: string, candidateJobId: string, user: JwtPayload): Promise<{
        inviteUrl: string;
        expiresAt: Date;
    }>;
    recruiterDecisionView(token: string): Promise<{
        candidate: {
            name: string;
            email: string | null;
        };
        job: {
            title: string;
            rounds: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                jobId: string;
                durationMinutes: number;
                orderIndex: number;
                label: string;
                roundType: import(".prisma/client").$Enums.JobRoundType;
                conductor: import(".prisma/client").$Enums.RoundConductor;
                meetProvider: import(".prisma/client").$Enums.MeetProvider;
            }[];
        };
        status: import(".prisma/client").$Enums.CandidateJobStatus;
        fitScore: number | null;
        expiresAt: Date;
    }>;
    recruiterDecisionSubmit(token: string, body: {
        outcome: RecruitmentDecisionOutcome;
        reason?: string;
        reviewerName?: string;
    }): Promise<{
        decision: {
            id: string;
            createdAt: Date;
            companyId: string;
            jobId: string;
            reason: string | null;
            candidateJobId: string;
            outcome: import(".prisma/client").$Enums.RecruitmentDecisionOutcome;
            decidedById: string | null;
            publicToken: string;
            candidateNotifiedAt: Date | null;
        };
        decisionUrl: string;
    }>;
    meetAccessView(accessToken: string): Promise<{
        scheduledAt: Date;
        meetUrl: string | null;
        meetProvider: import(".prisma/client").$Enums.MeetProvider;
        jobTitle: string;
        roundLabel: string;
        company: {
            name: string;
            logoUrl: string | null;
            primaryColor: string | null;
            secondaryColor: string | null;
        };
    }>;
}

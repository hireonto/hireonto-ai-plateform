import { RecruitmentDecisionOutcome } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DecisionsService } from './decisions.service';
export declare class DecisionInviteService {
    private readonly prisma;
    private readonly decisions;
    private readonly config;
    constructor(prisma: PrismaService, decisions: DecisionsService, config: ConfigService);
    createInvite(companyId: string, candidateJobId: string, createdById: string, ttlHours?: number): Promise<{
        inviteUrl: string;
        expiresAt: Date;
    }>;
    getInviteView(token: string): Promise<{
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
    submitViaInvite(token: string, outcome: RecruitmentDecisionOutcome, reason?: string, reviewerName?: string): Promise<{
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
}

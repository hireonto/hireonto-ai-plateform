import { RecruitmentDecisionOutcome } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
export declare class DecisionsService {
    private readonly prisma;
    private readonly email;
    private readonly config;
    constructor(prisma: PrismaService, email: EmailService, config: ConfigService);
    submit(companyId: string, candidateJobId: string, decidedById: string, outcome: RecruitmentDecisionOutcome, reason?: string): Promise<{
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
    getByToken(token: string): Promise<{
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
}

import { JobRoundType, RoundConductor, MeetProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlanFeaturesService } from './plan-features.service';
export type RoundInput = {
    label: string;
    roundType: JobRoundType;
    conductor: RoundConductor;
    meetProvider?: MeetProvider;
    durationMinutes?: number;
};
export declare class RoundsService {
    private readonly prisma;
    private readonly planFeatures;
    constructor(prisma: PrismaService, planFeatures: PlanFeaturesService);
    list(companyId: string, jobId: string): Promise<{
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
    replace(companyId: string, jobId: string, rounds: RoundInput[]): Promise<{
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
    ensureDefaults(jobId: string): Promise<void>;
    private replaceInternal;
    private assertJob;
}

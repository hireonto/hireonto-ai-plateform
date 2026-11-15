import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    funnel(companyId: string, jobId?: string): Promise<{
        funnel: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.CandidateJobGroupByOutputType, "status"[]> & {
            _count: number;
        })[];
    }>;
    perJob(companyId: string): Promise<{
        jobId: string;
        title: string;
        candidates: number;
        avgFit: number;
        interviews: number;
        completedInterviews: number;
    }[]>;
    perRecruiter(companyId: string): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        jobsCreated: number;
    }[]>;
    integrity(companyId: string): Promise<{
        avgRisk: number;
        terminatedCount: number;
        sampleSize: number;
    }>;
}

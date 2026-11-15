import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analytics;
    constructor(analytics: AnalyticsService);
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

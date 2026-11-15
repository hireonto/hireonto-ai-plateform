import { InterviewsService } from './interviews.service';
export declare class InterviewsController {
    private readonly interviews;
    constructor(interviews: InterviewsService);
    list(companyId: string, jobId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        job: {
            id: string;
            title: string;
        };
        candidate: {
            id: string;
            email: string | null;
            firstName: string | null;
            lastName: string | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.InterviewStatus;
        createdAt: Date;
        companyId: string;
        updatedAt: Date;
        deletedAt: Date | null;
        jobId: string;
        candidateId: string;
        windowStart: Date;
        windowEnd: Date;
        startedAt: Date | null;
        finishedAt: Date | null;
        reconnectUsedAt: Date | null;
        strikeCount: number;
        accessToken: string | null;
        jobRoundId: string | null;
    })[]>;
    fromShortlist(companyId: string, jobId: string, body: {
        candidateJobIds: string[];
        emails?: Record<string, string>;
    }): Promise<{
        created: {
            interviewId: string;
            candidateJobId: string;
            email: string;
            emailSent: boolean;
        }[];
        skipped: {
            candidateJobId: string;
            reason: string;
        }[];
    }>;
    extend(companyId: string, interviewId: string, body: {
        extraHours: number;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.InterviewStatus;
        createdAt: Date;
        companyId: string;
        updatedAt: Date;
        deletedAt: Date | null;
        jobId: string;
        candidateId: string;
        windowStart: Date;
        windowEnd: Date;
        startedAt: Date | null;
        finishedAt: Date | null;
        reconnectUsedAt: Date | null;
        strikeCount: number;
        accessToken: string | null;
        jobRoundId: string | null;
    }>;
    cancel(companyId: string, interviewId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.InterviewStatus;
        createdAt: Date;
        companyId: string;
        updatedAt: Date;
        deletedAt: Date | null;
        jobId: string;
        candidateId: string;
        windowStart: Date;
        windowEnd: Date;
        startedAt: Date | null;
        finishedAt: Date | null;
        reconnectUsedAt: Date | null;
        strikeCount: number;
        accessToken: string | null;
        jobRoundId: string | null;
    }>;
    resend(companyId: string, interviewId: string, body?: {
        email?: string;
    }): Promise<{
        resent: boolean;
        email: string;
        emailSent: boolean;
    }>;
}

import { Queue } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewScheduledJob } from './interviews.constants';
export declare class InterviewsService {
    private readonly prisma;
    private readonly notifications;
    private readonly interviewQueue;
    constructor(prisma: PrismaService, notifications: NotificationsService, interviewQueue: Queue<InterviewScheduledJob>);
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
    createFromShortlist(companyId: string, jobId: string, candidateJobIds: string[], emails?: Record<string, string>): Promise<{
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
    private setCandidateEmail;
    extend(companyId: string, interviewId: string, extraHours: number): Promise<{
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
    resendInvite(companyId: string, interviewId: string, email?: string): Promise<{
        resent: boolean;
        email: string;
        emailSent: boolean;
    }>;
    private get;
    private scheduleJobs;
}

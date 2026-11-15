import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewScheduledJob } from './interviews.constants';
export declare class InterviewsProcessor extends WorkerHost {
    private readonly prisma;
    private readonly notifications;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    process(job: Job<InterviewScheduledJob>): Promise<{
        skipped: boolean;
        reason?: undefined;
        expired?: undefined;
    } | {
        skipped: boolean;
        reason: string;
        expired?: undefined;
    } | {
        expired: boolean;
        skipped?: undefined;
        reason?: undefined;
    } | {
        skipped: boolean;
        sent?: undefined;
    } | {
        sent: boolean;
        skipped?: undefined;
    }>;
    private expire;
    private reminder;
}

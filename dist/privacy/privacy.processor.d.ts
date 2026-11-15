import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RetentionJobData } from './privacy.constants';
export declare class PrivacyProcessor extends WorkerHost {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    process(job: Job<RetentionJobData>): Promise<{
        deleted: number;
    }>;
}

import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiClientService } from '../ai-client/ai-client.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResumeParseJobData } from './candidates.constants';
export declare class CandidatesProcessor extends WorkerHost {
    private readonly prisma;
    private readonly ai;
    private readonly logger;
    constructor(prisma: PrismaService, ai: AiClientService);
    process(job: Job<ResumeParseJobData>): Promise<{
        resumeId: string;
        fitScore: number;
    }>;
}

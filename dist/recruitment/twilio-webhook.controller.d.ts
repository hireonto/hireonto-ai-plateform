import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PstnService } from './pstn.service';
import { SchedulingService } from './scheduling.service';
export declare class TwilioWebhookController {
    private readonly pstn;
    private readonly prisma;
    private readonly scheduling;
    private readonly config;
    constructor(pstn: PstnService, prisma: PrismaService, scheduling: SchedulingService, config: ConfigService);
    outbound(callId: string, res: Response): Promise<void>;
    gather(callId: string, body: {
        Digits?: string;
    }, res: Response): Promise<void>;
    status(callId: string, body: {
        CallStatus?: string;
    }): Promise<{
        ok: boolean;
    }>;
}

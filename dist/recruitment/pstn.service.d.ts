import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class PstnService {
    private readonly config;
    private readonly prisma;
    private readonly logger;
    constructor(config: ConfigService, prisma: PrismaService);
    isConfigured(): boolean;
    dialOutbound(callId: string, phone: string | null | undefined): Promise<boolean>;
    buildOutboundTwiml(callId: string, prompt: string, gatherUrl: string): string;
    buildDeclineTwiml(): string;
    buildConfirmTwiml(): string;
    private escapeXml;
}

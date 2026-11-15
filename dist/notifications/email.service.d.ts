import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export interface SendEmailInput {
    companyId: string;
    to: string;
    subject: string;
    template: string;
    html: string;
    metadata?: Record<string, unknown>;
}
export declare class EmailService {
    private readonly config;
    private readonly prisma;
    private readonly logger;
    private transporter?;
    constructor(config: ConfigService, prisma: PrismaService);
    send(input: SendEmailInput): Promise<{
        id: string;
        sent: boolean;
    }>;
}

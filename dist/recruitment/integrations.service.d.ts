import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { CompanyIntegrations, IntegrationsStatus } from './integrations.types';
export declare class IntegrationsService {
    private readonly prisma;
    private readonly config;
    private readonly jwt;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService, jwt: JwtService);
    status(companyId: string): Promise<IntegrationsStatus>;
    startGoogleConnect(companyId: string, userId: string): Promise<{
        authorizeUrl: string;
    }>;
    startMicrosoftConnect(companyId: string, userId: string): Promise<{
        authorizeUrl: string;
    }>;
    handleGoogleCallback(code: string, state: string): Promise<{
        redirectUrl: string;
    }>;
    handleMicrosoftCallback(code: string, state: string): Promise<{
        redirectUrl: string;
    }>;
    disconnect(companyId: string, provider: 'google' | 'microsoft'): Promise<{
        ok: boolean;
    }>;
    loadIntegrations(companyId: string): Promise<CompanyIntegrations>;
    private mergeIntegrations;
    private signState;
    private verifyState;
    private redirectAfterConnect;
}

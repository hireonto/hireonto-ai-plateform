import type { Response } from 'express';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { IntegrationsService } from './integrations.service';
export declare class IntegrationsController {
    private readonly integrations;
    constructor(integrations: IntegrationsService);
    status(companyId: string): Promise<import("./integrations.types").IntegrationsStatus>;
    googleConnect(companyId: string, user: JwtPayload): Promise<{
        authorizeUrl: string;
    }>;
    googleCallback(code: string, state: string, error: string | undefined, res: Response): Promise<void>;
    microsoftConnect(companyId: string, user: JwtPayload): Promise<{
        authorizeUrl: string;
    }>;
    microsoftCallback(code: string, state: string, error: string | undefined, res: Response): Promise<void>;
    disconnect(companyId: string, provider: 'google' | 'microsoft'): Promise<{
        ok: boolean;
    }>;
}

import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
export declare class SttController {
    private readonly config;
    private proxy;
    constructor(config: ConfigService);
    proxyRequest(req: Request, res: Response): void;
}

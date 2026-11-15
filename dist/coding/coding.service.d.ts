import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class CodingService {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService);
    runSample(params: {
        answerId: string;
        languageId: number;
        sourceCode: string;
        stdin?: string;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.CodeSubmissionStatus;
        createdAt: Date;
        updatedAt: Date;
        answerId: string;
        languageId: number;
        sourceCode: string;
        stdin: string | null;
        stdout: string | null;
        stderr: string | null;
        judge0Token: string | null;
        isHiddenTest: boolean;
        passedTests: number | null;
        totalTests: number | null;
    }>;
    submitHidden(params: {
        answerId: string;
        languageId: number;
        sourceCode: string;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.CodeSubmissionStatus;
        createdAt: Date;
        updatedAt: Date;
        answerId: string;
        languageId: number;
        sourceCode: string;
        stdin: string | null;
        stdout: string | null;
        stderr: string | null;
        judge0Token: string | null;
        isHiddenTest: boolean;
        passedTests: number | null;
        totalTests: number | null;
    }>;
    private submitToJudge0;
}

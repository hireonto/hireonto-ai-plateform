import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CodingService } from './coding.service';
export declare class CodingController {
    private readonly coding;
    constructor(coding: CodingService);
    run(_user: JwtPayload, answerId: string, body: {
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
    submit(_user: JwtPayload, answerId: string, body: {
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
}

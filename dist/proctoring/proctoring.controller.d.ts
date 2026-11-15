import { PrismaService } from '../prisma/prisma.service';
import { ProctoringService } from './proctoring.service';
export declare class ProctoringController {
    private readonly proctoring;
    private readonly prisma;
    constructor(proctoring: ProctoringService, prisma: PrismaService);
    ingest(interviewId: string, body: {
        events: Array<{
            eventType: string;
            severity?: string;
            payload?: Record<string, unknown>;
            clientTimestamp?: string;
        }>;
    }): Promise<{
        stored: number;
        strikeCount: number;
        terminated: boolean;
    }>;
    timeline(companyId: string, interviewId: string): Promise<{
        id: string;
        interviewId: string;
        eventType: string;
        severity: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        clientTimestamp: Date | null;
        receivedAt: Date;
    }[]>;
    private assertInterview;
}

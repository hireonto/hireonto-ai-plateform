import { PrismaService } from '../prisma/prisma.service';
export declare const STRIKE_TERMINATE_THRESHOLD = 3;
export declare class ProctoringService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    ingestBatch(interviewId: string, events: Array<{
        eventType: string;
        severity?: string;
        payload?: Record<string, unknown>;
        clientTimestamp?: string;
    }>): Promise<{
        stored: number;
        strikeCount: number;
        terminated: boolean;
    }>;
    timeline(interviewId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        interviewId: string;
        eventType: string;
        severity: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        clientTimestamp: Date | null;
        receivedAt: Date;
    }[]>;
    recordDisconnect(interviewId: string): Promise<{
        stored: number;
        strikeCount: number;
        terminated: boolean;
    }>;
}

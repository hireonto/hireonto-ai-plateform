import { PrismaService } from '../prisma/prisma.service';
export declare class AuditController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId: string, resourceType?: string, resourceId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        companyId: string;
        action: import(".prisma/client").$Enums.AuditAction;
        resourceType: string;
        resourceId: string;
        ipAddress: string | null;
        userAgent: string | null;
        actorId: string | null;
    }[]>;
}

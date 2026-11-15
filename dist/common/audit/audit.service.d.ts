import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(params: {
        companyId: string;
        actorId?: string;
        action: AuditAction;
        resourceType: string;
        resourceId: string;
        metadata?: Record<string, unknown>;
        ipAddress?: string;
        userAgent?: string;
    }): import(".prisma/client").Prisma.Prisma__AuditLogClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}

import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(params: {
    companyId: string;
    actorId?: string;
    action: AuditAction;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        actorId: params.actorId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        metadata: (params.metadata ?? {}) as object,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }
}

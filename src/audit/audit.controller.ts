import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StaffGuard } from '../auth/guards/staff.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(StaffGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Audit log for candidate data access' })
  list(
    @TenantId() companyId: string,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        companyId,
        ...(resourceType ? { resourceType } : {}),
        ...(resourceId ? { resourceId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}

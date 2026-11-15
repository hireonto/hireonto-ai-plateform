import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StaffGuard } from '../auth/guards/staff.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(StaffGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('funnel')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  funnel(@TenantId() companyId: string, @Query('jobId') jobId?: string) {
    return this.analytics.funnel(companyId, jobId);
  }

  @Get('jobs')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  perJob(@TenantId() companyId: string) {
    return this.analytics.perJob(companyId);
  }

  @Get('recruiters')
  @Roles(UserRole.ADMIN)
  perRecruiter(@TenantId() companyId: string) {
    return this.analytics.perRecruiter(companyId);
  }

  @Get('integrity')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Proctoring / integrity stats' })
  integrity(@TenantId() companyId: string) {
    return this.analytics.integrity(companyId);
  }
}

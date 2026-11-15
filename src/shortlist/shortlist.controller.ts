import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StaffGuard } from '../auth/guards/staff.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ShortlistService } from './shortlist.service';

@ApiTags('shortlist')
@ApiBearerAuth()
@UseGuards(StaffGuard)
@Controller('jobs/:jobId/shortlist')
export class ShortlistController {
  constructor(private readonly shortlist: ShortlistService) {}

  @Post('auto')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Auto-shortlist by fit threshold' })
  auto(@TenantId() companyId: string, @Param('jobId') jobId: string) {
    return this.shortlist.autoShortlist(companyId, jobId);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Bulk shortlist / reject / hold' })
  bulk(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @Body() body: { candidateJobIds: string[]; action: 'shortlist' | 'reject' | 'hold' },
  ) {
    return this.shortlist.bulkAction(
      companyId,
      jobId,
      body.candidateJobIds ?? [],
      body.action,
    );
  }

  @Get(':candidateJobId/history')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  history(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @Param('candidateJobId') candidateJobId: string,
  ) {
    return this.shortlist.history(companyId, jobId, candidateJobId);
  }
}

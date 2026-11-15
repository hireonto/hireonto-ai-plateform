import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StaffGuard } from '../auth/guards/staff.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { PrivacyService } from './privacy.service';

@ApiTags('privacy')
@ApiBearerAuth()
@UseGuards(StaffGuard)
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService) {}

  @Post('retention/run')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Schedule daily recording retention job' })
  retention(@TenantId() companyId: string) {
    return this.privacy.scheduleRetention(companyId, 30);
  }

  @Get('candidates/:candidateId/export')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  export(
    @TenantId() companyId: string,
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.privacy.exportCandidate(companyId, candidateId, user.sub);
  }

  @Delete('candidates/:candidateId')
  @Roles(UserRole.ADMIN)
  delete(
    @TenantId() companyId: string,
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.privacy.deleteCandidate(companyId, candidateId, user.sub);
  }
}

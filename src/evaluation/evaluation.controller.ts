import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StaffGuard } from '../auth/guards/staff.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { EvaluationService } from './evaluation.service';

@ApiTags('evaluation')
@ApiBearerAuth()
@UseGuards(StaffGuard)
@Controller('interviews/:interviewId/evaluation')
export class EvaluationController {
  constructor(private readonly evaluation: EvaluationService) {}

  @Post('trigger')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Trigger AI evaluation + proctoring analysis' })
  trigger(@TenantId() companyId: string, @Param('interviewId') interviewId: string) {
    return this.evaluation.trigger(interviewId, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  get(@TenantId() companyId: string, @Param('interviewId') interviewId: string) {
    return this.evaluation.getReport(companyId, interviewId);
  }

  @Post('override')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  override(
    @TenantId() companyId: string,
    @Param('interviewId') interviewId: string,
    @Body()
    body: {
      overrideScore?: number;
      finalDecision?: string;
      humanOverride?: Record<string, unknown>;
    },
  ) {
    return this.evaluation.override(companyId, interviewId, body);
  }
}

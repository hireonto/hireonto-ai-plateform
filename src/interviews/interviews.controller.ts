import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StaffGuard } from '../auth/guards/staff.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { InterviewsService } from './interviews.service';

@ApiTags('interviews')
@ApiBearerAuth()
@UseGuards(StaffGuard)
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviews: InterviewsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  list(@TenantId() companyId: string, @Query('jobId') jobId?: string) {
    return this.interviews.list(companyId, jobId);
  }

  @Post('jobs/:jobId/from-shortlist')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Create interviews for shortlisted candidates' })
  fromShortlist(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @Body() body: { candidateJobIds: string[]; emails?: Record<string, string> },
  ) {
    return this.interviews.createFromShortlist(
      companyId,
      jobId,
      body.candidateJobIds ?? [],
      body.emails ?? {},
    );
  }

  @Patch(':interviewId/extend')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  extend(
    @TenantId() companyId: string,
    @Param('interviewId') interviewId: string,
    @Body() body: { extraHours: number },
  ) {
    return this.interviews.extend(companyId, interviewId, body.extraHours ?? 24);
  }

  @Patch(':interviewId/cancel')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  cancel(
    @TenantId() companyId: string,
    @Param('interviewId') interviewId: string,
  ) {
    return this.interviews.cancel(companyId, interviewId);
  }

  @Post(':interviewId/resend')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  resend(
    @TenantId() companyId: string,
    @Param('interviewId') interviewId: string,
    @Body() body: { email?: string } = {},
  ) {
    return this.interviews.resendInvite(companyId, interviewId, body?.email);
  }
}

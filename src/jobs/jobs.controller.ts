import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StaffGuard } from '../auth/guards/staff.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import {
  CreateJobDto,
  JobInterviewConfigDto,
} from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import {
  JdPresignDto,
  QuestionBankPresignDto,
} from './dto/upload-presign.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(StaffGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  list(@TenantId() companyId: string) {
    return this.jobs.list(companyId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  create(
    @TenantId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateJobDto,
  ) {
    return this.jobs.create(companyId, dto, user.sub);
  }

  @Get(':jobId')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  get(@TenantId() companyId: string, @Param('jobId') jobId: string) {
    return this.jobs.get(companyId, jobId);
  }

  @Patch(':jobId')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  update(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobs.update(companyId, jobId, dto);
  }

  @Patch(':jobId/interview-config')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  interviewConfig(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @Body() dto: JobInterviewConfigDto,
  ) {
    return this.jobs.upsertInterviewConfig(companyId, jobId, dto);
  }

  @Post(':jobId/jd/presign')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  presignJd(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @Body() dto: JdPresignDto,
  ) {
    return this.jobs.presignJd(companyId, jobId, dto.fileName, dto.contentType);
  }

  @Post(':jobId/question-banks/presign')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  presignQuestionBank(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @Body() dto: QuestionBankPresignDto,
  ) {
    return this.jobs.presignQuestionBank(
      companyId,
      jobId,
      dto.fileName,
      dto.contentType,
    );
  }
}

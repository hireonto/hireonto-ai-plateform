import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StaffGuard } from '../auth/guards/staff.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CandidatesService } from './candidates.service';
import {
  BulkResumeUploadDto,
  ConfirmBulkUploadDto,
} from './dto/bulk-upload.dto';

@ApiTags('candidates')
@ApiBearerAuth()
@UseGuards(StaffGuard)
@Controller()
export class CandidatesController {
  constructor(private readonly candidates: CandidatesService) {}

  @Get('jobs/:jobId/candidates')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  @ApiOperation({ summary: 'List candidates for a job with fit scores' })
  listForJob(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.candidates.listForJob(companyId, jobId);
  }

  @Get('candidates/:candidateId')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  @ApiOperation({ summary: 'Candidate profile, resumes, job applications' })
  profile(
    @TenantId() companyId: string,
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.candidates.getProfileAudited(companyId, candidateId, user.sub);
  }

  @Post('jobs/:jobId/candidates/bulk/presign')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Bulk resume upload — presigned PUT URLs' })
  bulkPresign(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @Body() dto: BulkResumeUploadDto,
  ) {
    return this.candidates.bulkPresign(companyId, jobId, dto.files);
  }

  @Post('jobs/:jobId/candidates/bulk/confirm')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'After S3 upload, enqueue resume parse jobs' })
  bulkConfirm(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @Body() dto: ConfirmBulkUploadDto,
  ) {
    return this.candidates.confirmBulkUpload(companyId, jobId, dto.resumeIds);
  }

  @Patch('candidates/:candidateId/tags')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  tags(
    @TenantId() companyId: string,
    @Param('candidateId') candidateId: string,
    @Body() body: { tags: string[] },
  ) {
    return this.candidates.updateTags(companyId, candidateId, body.tags ?? []);
  }

  @Patch('candidates/:candidateId/notes')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  notes(
    @TenantId() companyId: string,
    @Param('candidateId') candidateId: string,
    @Body() body: { notes: string },
  ) {
    return this.candidates.updateNotes(companyId, candidateId, body.notes ?? '');
  }
}

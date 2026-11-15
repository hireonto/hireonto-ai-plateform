import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StaffGuard } from '../auth/guards/staff.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ProctoringService } from './proctoring.service';

@ApiTags('proctoring')
@Controller('interviews/:interviewId/proctoring')
export class ProctoringController {
  constructor(
    private readonly proctoring: ProctoringService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('events')
  @ApiOperation({ summary: 'REST fallback — batch proctoring events' })
  async ingest(
    @Param('interviewId') interviewId: string,
    @Body()
    body: {
      events: Array<{
        eventType: string;
        severity?: string;
        payload?: Record<string, unknown>;
        clientTimestamp?: string;
      }>;
    },
  ) {
    await this.assertInterview(interviewId);
    return this.proctoring.ingestBatch(interviewId, body.events ?? []);
  }

  @Get('timeline')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  @ApiOperation({ summary: 'Proctoring event timeline' })
  async timeline(
    @TenantId() companyId: string,
    @Param('interviewId') interviewId: string,
  ) {
    await this.assertInterview(interviewId, companyId);
    return this.proctoring.timeline(interviewId);
  }

  private async assertInterview(interviewId: string, companyId?: string) {
    const interview = await this.prisma.interview.findFirst({
      where: {
        id: interviewId,
        deletedAt: null,
        ...(companyId ? { companyId } : {}),
      },
    });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }
    return interview;
  }
}

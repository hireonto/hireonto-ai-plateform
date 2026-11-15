import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StaffGuard } from '../auth/guards/staff.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { AuditService } from '../common/audit/audit.service';
import { MediaService } from './media.service';

@ApiTags('media')
@ApiBearerAuth()
@Controller('sessions/:interviewId/media')
export class MediaController {
  constructor(
    private readonly media: MediaService,
    private readonly audit: AuditService,
  ) {}

  @Post('chunks/presign')
  @ApiOperation({ summary: 'Presign chunked recording upload' })
  presignChunk(
    @Param('interviewId') interviewId: string,
    @Body()
    body: {
      streamType: 'camera' | 'screen';
      chunkIndex: number;
      contentType: string;
    },
  ) {
    return this.media.presignChunk(
      interviewId,
      body.streamType,
      body.chunkIndex,
      body.contentType,
    );
  }

  @Post('chunks/confirm')
  @ApiOperation({ summary: 'Confirm chunk uploaded to S3' })
  confirmChunk(
    @Param('interviewId') interviewId: string,
    @Body()
    body: {
      streamType: string;
      chunkIndex: number;
      storageKey: string;
      byteSize: number;
    },
  ) {
    return this.media.confirmChunk(
      interviewId,
      body.streamType,
      body.chunkIndex,
      body.storageKey,
      body.byteSize,
    );
  }

  @Post('snapshots/presign')
  presignSnapshot(
    @Param('interviewId') interviewId: string,
    @Body() body: { contentType: string },
  ) {
    return this.media.presignSnapshot(interviewId, body.contentType);
  }

  @Post('snapshots')
  saveSnapshot(
    @Param('interviewId') interviewId: string,
    @Body() body: { storageKey: string; eventType?: string },
  ) {
    return this.media.saveSnapshot(interviewId, body.storageKey, body.eventType);
  }

  @Get('playback')
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  @ApiOperation({ summary: 'Signed playback URL for recording chunk' })
  async playback(
    @TenantId() companyId: string,
    @Param('interviewId') interviewId: string,
    @Query('storageKey') storageKey: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.audit.log({
      companyId,
      actorId: user.sub,
      action: 'VIEW',
      resourceType: 'media',
      resourceId: interviewId,
      metadata: { storageKey },
    });
    return this.media.playbackUrl(companyId, interviewId, storageKey);
  }
}

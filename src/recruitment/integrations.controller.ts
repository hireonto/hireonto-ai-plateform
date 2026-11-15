import { Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { StaffGuard } from '../auth/guards/staff.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get('status')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  status(@TenantId() companyId: string) {
    return this.integrations.status(companyId);
  }

  @Post('google/connect')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Start Google Calendar OAuth' })
  googleConnect(@TenantId() companyId: string, @CurrentUser() user: JwtPayload) {
    return this.integrations.startGoogleConnect(companyId, user.sub);
  }

  @Get('google/callback')
  @Public()
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    if (error || !code) {
      res.redirect(`${appUrl}/settings?connected=google&error=1`);
      return;
    }
    const { redirectUrl } = await this.integrations.handleGoogleCallback(code, state);
    res.redirect(redirectUrl);
  }

  @Post('microsoft/connect')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN)
  microsoftConnect(@TenantId() companyId: string, @CurrentUser() user: JwtPayload) {
    return this.integrations.startMicrosoftConnect(companyId, user.sub);
  }

  @Get('microsoft/callback')
  @Public()
  async microsoftCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    if (error || !code) {
      res.redirect(`${appUrl}/settings?connected=microsoft&error=1`);
      return;
    }
    const { redirectUrl } = await this.integrations.handleMicrosoftCallback(code, state);
    res.redirect(redirectUrl);
  }

  @Post(':provider/disconnect')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN)
  disconnect(@TenantId() companyId: string, @Param('provider') provider: 'google' | 'microsoft') {
    return this.integrations.disconnect(companyId, provider);
  }
}

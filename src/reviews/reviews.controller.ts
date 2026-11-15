import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StaffGuard } from '../auth/guards/staff.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('interviews/:interviewId/reviews')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  list(@TenantId() companyId: string, @Param('interviewId') interviewId: string) {
    return this.reviews.list(interviewId, companyId);
  }

  @Post('interviews/:interviewId/reviews')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  create(
    @TenantId() companyId: string,
    @Param('interviewId') interviewId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { score: number; comments?: string },
  ) {
    return this.reviews.createStaffReview(
      interviewId,
      companyId,
      user.sub,
      body.score,
      body.comments,
    );
  }

  @Post('interviews/:interviewId/guest-links')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  guestLink(
    @TenantId() companyId: string,
    @Param('interviewId') interviewId: string,
    @Body() body: { ttlHours?: number },
  ) {
    return this.reviews.createGuestLink(
      interviewId,
      companyId,
      body.ttlHours ?? 72,
    );
  }

  @Public()
  @Post('guest/reviews')
  @ApiOperation({ summary: 'Guest reviewer submit (expiring token)' })
  guestSubmit(@Body() body: { token: string; score: number; comments?: string }) {
    return this.reviews.submitGuestReview(body.token, body.score, body.comments);
  }
}

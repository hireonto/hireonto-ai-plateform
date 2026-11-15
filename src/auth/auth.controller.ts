import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import {
  CandidateInterviewLoginDto,
  CandidateLoginDto,
  CandidateMagicLinkRequestDto,
} from './dto/candidate-magic-link.dto';
import { StaffLoginDto } from './dto/login.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/password-reset.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('staff/login')
  @ApiOperation({ summary: 'Staff login (email + password)' })
  staffLogin(@Body() dto: StaffLoginDto) {
    return this.auth.staffLogin(dto.email, dto.password);
  }

  @Public()
  @Post('staff/refresh')
  @ApiOperation({ summary: 'Refresh staff access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @Post('staff/accept-invite')
  @ApiOperation({ summary: 'Accept recruiter/interviewer invite' })
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.auth.acceptInvite(dto.token, dto.password);
  }

  @Public()
  @Post('staff/password-reset/request')
  @ApiOperation({ summary: 'Request password reset email' })
  requestReset(@Body() dto: RequestPasswordResetDto) {
    return this.auth.requestPasswordReset(dto.email);
  }

  @Public()
  @Post('staff/password-reset/confirm')
  @ApiOperation({ summary: 'Confirm password reset with token' })
  confirmReset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Post('candidate/magic-link')
  @ApiOperation({ summary: 'Send candidate magic login link' })
  candidateMagicLink(@Body() dto: CandidateMagicLinkRequestDto) {
    return this.auth.candidateMagicLink(dto.email, dto.interviewToken);
  }

  @Public()
  @Post('candidate/login')
  @ApiOperation({ summary: 'Candidate login via magic link (+ optional temp password)' })
  candidateLogin(@Body() dto: CandidateLoginDto) {
    return this.auth.candidateLogin(dto.token, dto.tempPassword);
  }

  @Public()
  @Get('candidate/interview/:accessToken')
  @ApiOperation({ summary: 'Public interview preview for the invite link' })
  candidateInterviewPreview(@Param('accessToken') accessToken: string) {
    return this.auth.candidateInterviewPreview(accessToken);
  }

  @Public()
  @Post('candidate/interview-login')
  @ApiOperation({ summary: 'Candidate login via invite link token + temp password' })
  candidateInterviewLogin(@Body() dto: CandidateInterviewLoginDto) {
    return this.auth.candidateInterviewLogin(dto.accessToken, dto.tempPassword);
  }
}

import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { StaffGuard } from '../auth/guards/staff.guard';
import { SessionsService } from './sessions.service';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions/:interviewId')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  private candidateId(user: JwtPayload) {
    if (user.aud !== 'candidate') {
      throw new ForbiddenException('Candidate token required');
    }
    return user.sub;
  }

  @Post('start')
  @ApiOperation({ summary: 'Start interview session' })
  start(@Param('interviewId') interviewId: string, @CurrentUser() user: JwtPayload) {
    return this.sessions.start(interviewId, this.candidateId(user));
  }

  @Get('next-question')
  @ApiOperation({ summary: 'Get next unanswered question' })
  next(@Param('interviewId') interviewId: string, @CurrentUser() user: JwtPayload) {
    return this.sessions.nextQuestion(interviewId, this.candidateId(user));
  }

  @Post('questions/:questionId/answer')
  @ApiOperation({ summary: 'Submit answer (text/transcript/code)' })
  answer(
    @Param('interviewId') interviewId: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: { text?: string; transcript?: string; code?: string; audioUrl?: string },
  ) {
    return this.sessions.submitAnswer(
      interviewId,
      this.candidateId(user),
      questionId,
      body,
    );
  }

  @Post('questions/:questionId/follow-up')
  @ApiOperation({ summary: 'Request AI follow-up question' })
  followUp(
    @Param('interviewId') interviewId: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sessions.requestFollowUp(
      interviewId,
      this.candidateId(user),
      questionId,
    );
  }

  @Post('reconnect')
  @ApiOperation({ summary: 'One reconnect within 5 minutes' })
  reconnect(
    @Param('interviewId') interviewId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sessions.reconnect(interviewId, this.candidateId(user));
  }

  @Post('finish')
  @ApiOperation({ summary: 'Finish interview' })
  finish(@Param('interviewId') interviewId: string, @CurrentUser() user: JwtPayload) {
    return this.sessions.finish(interviewId, this.candidateId(user));
  }

  @Post('stt-token')
  @ApiOperation({ summary: '2-minute signed STT stream token' })
  sttToken(@Param('interviewId') interviewId: string, @CurrentUser() user: JwtPayload) {
    return this.sessions.sttToken(interviewId, this.candidateId(user));
  }
}

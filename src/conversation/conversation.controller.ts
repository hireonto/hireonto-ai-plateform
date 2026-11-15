import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  ForbiddenException,
  Get,
  Injectable,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { Request } from 'express';
import { StaffGuard } from '../auth/guards/staff.guard';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { ConversationService } from './conversation.service';

class ChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  message!: string;
}

class AgentTurnDto {
  @IsIn(['interviewer', 'candidate'])
  role!: 'interviewer' | 'candidate';

  @IsString()
  @MinLength(1)
  text!: string;
}

class AgentProctoringDto {
  @IsString()
  eventType!: string;

  @IsIn(['info', 'warning', 'strike'])
  severity!: string;

  @IsString()
  @MaxLength(500)
  detail!: string;
}

class AgentCompleteDto {
  @IsString()
  reason!: string;
}

function candidateId(user: JwtPayload) {
  if (user.aud !== 'candidate') {
    throw new ForbiddenException('Candidate token required');
  }
  return user.sub;
}

@ApiTags('conversation')
@ApiBearerAuth()
@Controller('sessions/:interviewId/conversation')
export class ConversationController {
  constructor(private readonly conversation: ConversationService) {}

  @Post('start')
  @ApiOperation({
    summary: 'Start the AI interview: LiveKit voice token, or the text chat if voice is not configured',
  })
  start(@Param('interviewId') interviewId: string, @CurrentUser() user: JwtPayload) {
    return this.conversation.start(interviewId, candidateId(user));
  }

  @Post('ensure-agent')
  @ApiOperation({ summary: 'Voice mode: ask LiveKit to dispatch Tovia into the interview room again' })
  ensureAgent(@Param('interviewId') interviewId: string, @CurrentUser() user: JwtPayload) {
    return this.conversation.ensureVoiceAgent(interviewId, candidateId(user));
  }

  @Post('chat')
  @ApiOperation({ summary: 'Text mode: send a reply, get the interviewer’s next message' })
  chat(
    @Param('interviewId') interviewId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChatMessageDto,
  ) {
    return this.conversation.chat(interviewId, candidateId(user), dto.message);
  }
}

@ApiTags('conversation')
@ApiBearerAuth()
@UseGuards(StaffGuard)
@Controller('interviews/:interviewId')
export class TranscriptController {
  constructor(private readonly conversation: ConversationService) {}

  @Get('plan')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  @ApiOperation({ summary: 'RAG question plan generated for this interview' })
  plan(@TenantId() companyId: string, @Param('interviewId') interviewId: string) {
    return this.conversation.planForStaff(companyId, interviewId);
  }

  @Get('transcript')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  @ApiOperation({ summary: 'Interviewer/candidate conversation turns' })
  transcript(@TenantId() companyId: string, @Param('interviewId') interviewId: string) {
    return this.conversation.transcriptForStaff(companyId, interviewId);
  }
}

/** Accepts only short-lived JWTs signed by hiremind-ai with JWT_INTERNAL_SECRET. */
@Injectable()
export class InternalServiceGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.internalSecret'),
        audience: 'hiremind-backend',
      });
      return true;
    } catch {
      throw new UnauthorizedException('Invalid internal token');
    }
  }
}

@ApiExcludeController()
@Public()
@UseGuards(InternalServiceGuard)
@Controller('internal/interviews/:interviewId')
export class InternalInterviewController {
  constructor(private readonly conversation: ConversationService) {}

  @Get('context')
  context(@Param('interviewId') interviewId: string) {
    return this.conversation.context(interviewId);
  }

  @Post('turns')
  async turn(@Param('interviewId') interviewId: string, @Body() dto: AgentTurnDto) {
    await this.conversation.addTurn(interviewId, dto.role, dto.text);
    return { ok: true };
  }

  @Post('proctoring')
  proctoring(@Param('interviewId') interviewId: string, @Body() dto: AgentProctoringDto) {
    return this.conversation.agentProctoringEvent(interviewId, dto.eventType, dto.severity, dto.detail);
  }

  @Post('complete')
  complete(@Param('interviewId') interviewId: string, @Body() dto: AgentCompleteDto) {
    return this.conversation.complete(interviewId, dto.reason);
  }
}

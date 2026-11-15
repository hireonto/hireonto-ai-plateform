import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  JobRoundType,
  MeetProvider,
  RecruitmentDecisionOutcome,
  RoundConductor,
  SourcingSource,
  UserRole,
} from '@prisma/client';
import { StaffGuard } from '../auth/guards/staff.guard';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { DecisionInviteService } from './decision-invite.service';
import { DecisionsService } from './decisions.service';
import { MeetAccessService } from './meet-access.service';
import { PlanFeaturesService } from './plan-features.service';
import { RoundsService, type RoundInput } from './rounds.service';
import { SchedulingService } from './scheduling.service';
import { SourcingService, type IngestResumeDto } from './sourcing.service';

@ApiTags('recruitment')
@Controller()
export class RecruitmentController {
  constructor(
    private readonly rounds: RoundsService,
    private readonly sourcing: SourcingService,
    private readonly scheduling: SchedulingService,
    private readonly decisions: DecisionsService,
    private readonly decisionInvites: DecisionInviteService,
    private readonly meetAccess: MeetAccessService,
    private readonly planFeatures: PlanFeaturesService,
  ) {}

  @Get('recruitment/plan-features')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  planFeaturesForTenant(@TenantId() companyId: string) {
    return this.planFeatures.featuresForCompany(companyId);
  }

  @Get('jobs/:jobId/rounds')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.INTERVIEWER)
  getRounds(@TenantId() companyId: string, @Param('jobId') jobId: string) {
    return this.rounds.list(companyId, jobId);
  }

  @Patch('jobs/:jobId/rounds')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Replace job interview rounds (multi-round pipeline)' })
  replaceRounds(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @Body()
    body: {
      rounds: Array<{
        label: string;
        roundType: JobRoundType;
        conductor: RoundConductor;
        meetProvider?: MeetProvider;
        durationMinutes?: number;
      }>;
    },
  ) {
    return this.rounds.replace(companyId, jobId, body.rounds as RoundInput[]);
  }

  @Get('jobs/:jobId/sourcing')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  getSourcing(@TenantId() companyId: string, @Param('jobId') jobId: string) {
    return this.sourcing.getConfig(companyId, jobId);
  }

  @Patch('jobs/:jobId/sourcing')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  patchSourcing(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @Body()
    body: {
      enabled?: boolean;
      sources?: SourcingSource[];
      atsMinScore?: number;
      nonAtsMaxPercent?: number;
      searchKeywords?: string;
    },
  ) {
    return this.sourcing.upsertConfig(companyId, jobId, body);
  }

  @Post('jobs/:jobId/sourcing/ingest')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  ingestResume(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @Body() body: IngestResumeDto,
  ) {
    return this.sourcing.ingestOne(companyId, jobId, body);
  }

  @Post('jobs/:jobId/sourcing/run')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  runSourcing(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @Body() body: { resumes: IngestResumeDto[] },
  ) {
    return this.sourcing.runAgent(companyId, jobId, body.resumes ?? []);
  }

  @Post('jobs/:jobId/schedule/call-campaign')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  callCampaign(
    @TenantId() companyId: string,
    @Param('jobId') jobId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { candidateJobIds: string[]; promptTemplate: string },
  ) {
    return this.scheduling.startCallCampaign(
      companyId,
      jobId,
      user.sub,
      body.candidateJobIds,
      body.promptTemplate,
    );
  }

  @Post('candidate-jobs/:candidateJobId/decision')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  submitDecision(
    @TenantId() companyId: string,
    @Param('candidateJobId') candidateJobId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { outcome: RecruitmentDecisionOutcome; reason?: string },
  ) {
    return this.decisions.submit(companyId, candidateJobId, user.sub, body.outcome, body.reason);
  }

  @Public()
  @Get('decisions/:token')
  decisionByToken(@Param('token') token: string) {
    return this.decisions.getByToken(token);
  }

  @Post('candidate-jobs/:candidateJobId/decision-invite')
  @ApiBearerAuth()
  @UseGuards(StaffGuard)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  createDecisionInvite(
    @TenantId() companyId: string,
    @Param('candidateJobId') candidateJobId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.decisionInvites.createInvite(companyId, candidateJobId, user.sub);
  }

  @Public()
  @Get('recruit/decide/:token')
  recruiterDecisionView(@Param('token') token: string) {
    return this.decisionInvites.getInviteView(token);
  }

  @Public()
  @Post('recruit/decide/:token')
  recruiterDecisionSubmit(
    @Param('token') token: string,
    @Body()
    body: { outcome: RecruitmentDecisionOutcome; reason?: string; reviewerName?: string },
  ) {
    return this.decisionInvites.submitViaInvite(token, body.outcome, body.reason, body.reviewerName);
  }

  @Public()
  @Get('candidate/meet/:accessToken')
  meetAccessView(@Param('accessToken') accessToken: string) {
    return this.meetAccess.getByToken(accessToken);
  }
}

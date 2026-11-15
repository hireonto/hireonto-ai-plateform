import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiClientModule } from '../ai-client/ai-client.module';
import { CandidatesModule } from '../candidates/candidates.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CalendarService } from './calendar.service';
import { DecisionInviteService } from './decision-invite.service';
import { DecisionsService } from './decisions.service';
import { MeetAccessService } from './meet-access.service';
import { RoundAdvanceService } from './round-advance.service';
import { PlanFeaturesService } from './plan-features.service';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { PstnService } from './pstn.service';
import { RecruitmentController } from './recruitment.controller';
import { RoundsService } from './rounds.service';
import { SchedulingService } from './scheduling.service';
import { SourcingService } from './sourcing.service';
import { TwilioWebhookController } from './twilio-webhook.controller';

@Module({
  imports: [AuthModule, CandidatesModule, AiClientModule, NotificationsModule],
  controllers: [RecruitmentController, IntegrationsController, TwilioWebhookController],
  providers: [
    PlanFeaturesService,
    RoundsService,
    SourcingService,
    SchedulingService,
    CalendarService,
    DecisionsService,
    DecisionInviteService,
    MeetAccessService,
    RoundAdvanceService,
    IntegrationsService,
    PstnService,
  ],
  exports: [RoundsService, PlanFeaturesService, RoundAdvanceService],
})
export class RecruitmentModule {}

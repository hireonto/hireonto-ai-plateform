import { Module } from '@nestjs/common';
import { AiClientModule } from '../ai-client/ai-client.module';
import { AuthModule } from '../auth/auth.module';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { ProctoringModule } from '../proctoring/proctoring.module';
import { RecruitmentModule } from '../recruitment/recruitment.module';
import { RealtimeModule } from '../realtime/realtime.module';
import {
  ConversationController,
  InternalInterviewController,
  InternalServiceGuard,
  TranscriptController,
} from './conversation.controller';
import { ConversationService } from './conversation.service';

@Module({
  imports: [AuthModule, AiClientModule, EvaluationModule, RealtimeModule, ProctoringModule, RecruitmentModule],
  controllers: [ConversationController, TranscriptController, InternalInterviewController],
  providers: [ConversationService, InternalServiceGuard],
})
export class ConversationModule {}

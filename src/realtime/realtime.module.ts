import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProctoringModule } from '../proctoring/proctoring.module';
import { SessionsModule } from '../sessions/sessions.module';
import { InterviewGateway } from './interview.gateway';
import { RecruiterGateway } from './recruiter.gateway';

@Module({
  imports: [AuthModule, ProctoringModule, SessionsModule],
  providers: [InterviewGateway, RecruiterGateway],
  exports: [RecruiterGateway],
})
export class RealtimeModule {}

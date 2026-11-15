import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiClientService } from './ai-client.service';
import { InterviewContextService } from './interview-context.service';

@Module({
  imports: [AuthModule],
  providers: [AiClientService, InterviewContextService],
  exports: [AiClientService, InterviewContextService],
})
export class AiClientModule {}

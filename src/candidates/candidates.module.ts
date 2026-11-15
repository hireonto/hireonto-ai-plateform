import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AiClientModule } from '../ai-client/ai-client.module';
import { AuthModule } from '../auth/auth.module';
import { JobsModule } from '../jobs/jobs.module';
import { StorageModule } from '../storage/storage.module';
import { RESUME_PARSE_QUEUE } from './candidates.constants';
import { CandidatesController } from './candidates.controller';
import { CandidatesProcessor } from './candidates.processor';
import { CandidatesService } from './candidates.service';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    JobsModule,
    AiClientModule,
    BullModule.registerQueue({ name: RESUME_PARSE_QUEUE }),
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService, CandidatesProcessor],
  exports: [CandidatesService],
})
export class CandidatesModule {}

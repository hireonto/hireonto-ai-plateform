import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { INTERVIEW_JOBS_QUEUE } from './interviews.constants';
import { InterviewsController } from './interviews.controller';
import { InterviewsProcessor } from './interviews.processor';
import { InterviewsService } from './interviews.service';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    BullModule.registerQueue({ name: INTERVIEW_JOBS_QUEUE }),
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService, InterviewsProcessor],
  exports: [InterviewsService],
})
export class InterviewsModule {}

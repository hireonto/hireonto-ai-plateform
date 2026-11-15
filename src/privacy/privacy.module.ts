import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PRIVACY_QUEUE } from './privacy.constants';
import { PrivacyController } from './privacy.controller';
import { PrivacyProcessor } from './privacy.processor';
import { PrivacyService } from './privacy.service';

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: PRIVACY_QUEUE })],
  controllers: [PrivacyController],
  providers: [PrivacyService, PrivacyProcessor],
})
export class PrivacyModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecruitmentModule } from '../recruitment/recruitment.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [AuthModule, RecruitmentModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}

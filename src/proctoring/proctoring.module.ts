import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProctoringController } from './proctoring.controller';
import { ProctoringService } from './proctoring.service';

@Module({
  imports: [AuthModule],
  controllers: [ProctoringController],
  providers: [ProctoringService],
  exports: [ProctoringService],
})
export class ProctoringModule {}

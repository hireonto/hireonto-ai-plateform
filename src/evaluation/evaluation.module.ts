import { Module } from '@nestjs/common';
import { AiClientModule } from '../ai-client/ai-client.module';
import { AuthModule } from '../auth/auth.module';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';

@Module({
  imports: [AuthModule, AiClientModule],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}

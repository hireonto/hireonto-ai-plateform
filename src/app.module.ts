import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AiClientModule } from './ai-client/ai-client.module';
import { AuthModule } from './auth/auth.module';
import { CandidatesModule } from './candidates/candidates.module';
import { JobsModule } from './jobs/jobs.module';
import { InterviewsModule } from './interviews/interviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ShortlistModule } from './shortlist/shortlist.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditApiModule } from './audit/audit-api.module';
import { AuditModule } from './common/audit/audit.module';
import { CodingModule } from './coding/coding.module';
import { ConversationModule } from './conversation/conversation.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { MediaModule } from './media/media.module';
import { PrivacyModule } from './privacy/privacy.module';
import { ProctoringModule } from './proctoring/proctoring.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SessionsModule } from './sessions/sessions.module';
import { SttModule } from './stt/stt.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { TenantGuard } from './auth/guards/tenant.guard';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: false,
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // family: 0 lets ioredis resolve IPv6 hosts (Railway private networking).
        connection: { url: config.get<string>('redisUrl'), family: 0 },
      }),
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    AiClientModule,
    UsersModule,
    TenantsModule,
    JobsModule,
    CandidatesModule,
    ShortlistModule,
    InterviewsModule,
    NotificationsModule,
    SessionsModule,
    ConversationModule,
    CodingModule,
    MediaModule,
    ProctoringModule,
    RealtimeModule,
    SttModule,
    EvaluationModule,
    ReviewsModule,
    AnalyticsModule,
    AuditApiModule,
    PrivacyModule,
    WebhooksModule,
    RecruitmentModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

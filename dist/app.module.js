"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const nestjs_pino_1 = require("nestjs-pino");
const ai_client_module_1 = require("./ai-client/ai-client.module");
const auth_module_1 = require("./auth/auth.module");
const candidates_module_1 = require("./candidates/candidates.module");
const jobs_module_1 = require("./jobs/jobs.module");
const interviews_module_1 = require("./interviews/interviews.module");
const notifications_module_1 = require("./notifications/notifications.module");
const shortlist_module_1 = require("./shortlist/shortlist.module");
const analytics_module_1 = require("./analytics/analytics.module");
const audit_api_module_1 = require("./audit/audit-api.module");
const audit_module_1 = require("./common/audit/audit.module");
const coding_module_1 = require("./coding/coding.module");
const conversation_module_1 = require("./conversation/conversation.module");
const evaluation_module_1 = require("./evaluation/evaluation.module");
const media_module_1 = require("./media/media.module");
const privacy_module_1 = require("./privacy/privacy.module");
const proctoring_module_1 = require("./proctoring/proctoring.module");
const realtime_module_1 = require("./realtime/realtime.module");
const reviews_module_1 = require("./reviews/reviews.module");
const sessions_module_1 = require("./sessions/sessions.module");
const stt_module_1 = require("./stt/stt.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const recruitment_module_1 = require("./recruitment/recruitment.module");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const roles_guard_1 = require("./auth/guards/roles.guard");
const tenant_guard_1 = require("./auth/guards/tenant.guard");
const configuration_1 = __importDefault(require("./config/configuration"));
const env_validation_1 = require("./config/env.validation");
const health_controller_1 = require("./health/health.controller");
const prisma_module_1 = require("./prisma/prisma.module");
const tenants_module_1 = require("./tenants/tenants.module");
const users_module_1 = require("./users/users.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
                validate: env_validation_1.validateEnv,
            }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    transport: process.env.NODE_ENV !== 'production'
                        ? { target: 'pino-pretty', options: { singleLine: true } }
                        : undefined,
                    autoLogging: false,
                },
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60_000,
                    limit: 120,
                },
            ]),
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    connection: { url: config.get('redisUrl'), family: 0 },
                }),
            }),
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            ai_client_module_1.AiClientModule,
            users_module_1.UsersModule,
            tenants_module_1.TenantsModule,
            jobs_module_1.JobsModule,
            candidates_module_1.CandidatesModule,
            shortlist_module_1.ShortlistModule,
            interviews_module_1.InterviewsModule,
            notifications_module_1.NotificationsModule,
            sessions_module_1.SessionsModule,
            conversation_module_1.ConversationModule,
            coding_module_1.CodingModule,
            media_module_1.MediaModule,
            proctoring_module_1.ProctoringModule,
            realtime_module_1.RealtimeModule,
            stt_module_1.SttModule,
            evaluation_module_1.EvaluationModule,
            reviews_module_1.ReviewsModule,
            analytics_module_1.AnalyticsModule,
            audit_api_module_1.AuditApiModule,
            privacy_module_1.PrivacyModule,
            webhooks_module_1.WebhooksModule,
            recruitment_module_1.RecruitmentModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: tenant_guard_1.TenantGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruitmentModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const ai_client_module_1 = require("../ai-client/ai-client.module");
const candidates_module_1 = require("../candidates/candidates.module");
const notifications_module_1 = require("../notifications/notifications.module");
const calendar_service_1 = require("./calendar.service");
const decision_invite_service_1 = require("./decision-invite.service");
const decisions_service_1 = require("./decisions.service");
const meet_access_service_1 = require("./meet-access.service");
const round_advance_service_1 = require("./round-advance.service");
const plan_features_service_1 = require("./plan-features.service");
const integrations_controller_1 = require("./integrations.controller");
const integrations_service_1 = require("./integrations.service");
const pstn_service_1 = require("./pstn.service");
const recruitment_controller_1 = require("./recruitment.controller");
const rounds_service_1 = require("./rounds.service");
const scheduling_service_1 = require("./scheduling.service");
const sourcing_service_1 = require("./sourcing.service");
const twilio_webhook_controller_1 = require("./twilio-webhook.controller");
let RecruitmentModule = class RecruitmentModule {
};
exports.RecruitmentModule = RecruitmentModule;
exports.RecruitmentModule = RecruitmentModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, candidates_module_1.CandidatesModule, ai_client_module_1.AiClientModule, notifications_module_1.NotificationsModule],
        controllers: [recruitment_controller_1.RecruitmentController, integrations_controller_1.IntegrationsController, twilio_webhook_controller_1.TwilioWebhookController],
        providers: [
            plan_features_service_1.PlanFeaturesService,
            rounds_service_1.RoundsService,
            sourcing_service_1.SourcingService,
            scheduling_service_1.SchedulingService,
            calendar_service_1.CalendarService,
            decisions_service_1.DecisionsService,
            decision_invite_service_1.DecisionInviteService,
            meet_access_service_1.MeetAccessService,
            round_advance_service_1.RoundAdvanceService,
            integrations_service_1.IntegrationsService,
            pstn_service_1.PstnService,
        ],
        exports: [rounds_service_1.RoundsService, plan_features_service_1.PlanFeaturesService, round_advance_service_1.RoundAdvanceService],
    })
], RecruitmentModule);
//# sourceMappingURL=recruitment.module.js.map
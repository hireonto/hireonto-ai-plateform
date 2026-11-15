"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruitmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const staff_guard_1 = require("../auth/guards/staff.guard");
const public_decorator_1 = require("../common/decorators/public.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
const decision_invite_service_1 = require("./decision-invite.service");
const decisions_service_1 = require("./decisions.service");
const meet_access_service_1 = require("./meet-access.service");
const plan_features_service_1 = require("./plan-features.service");
const rounds_service_1 = require("./rounds.service");
const scheduling_service_1 = require("./scheduling.service");
const sourcing_service_1 = require("./sourcing.service");
let RecruitmentController = class RecruitmentController {
    constructor(rounds, sourcing, scheduling, decisions, decisionInvites, meetAccess, planFeatures) {
        this.rounds = rounds;
        this.sourcing = sourcing;
        this.scheduling = scheduling;
        this.decisions = decisions;
        this.decisionInvites = decisionInvites;
        this.meetAccess = meetAccess;
        this.planFeatures = planFeatures;
    }
    planFeaturesForTenant(companyId) {
        return this.planFeatures.featuresForCompany(companyId);
    }
    getRounds(companyId, jobId) {
        return this.rounds.list(companyId, jobId);
    }
    replaceRounds(companyId, jobId, body) {
        return this.rounds.replace(companyId, jobId, body.rounds);
    }
    getSourcing(companyId, jobId) {
        return this.sourcing.getConfig(companyId, jobId);
    }
    patchSourcing(companyId, jobId, body) {
        return this.sourcing.upsertConfig(companyId, jobId, body);
    }
    ingestResume(companyId, jobId, body) {
        return this.sourcing.ingestOne(companyId, jobId, body);
    }
    runSourcing(companyId, jobId, body) {
        return this.sourcing.runAgent(companyId, jobId, body.resumes ?? []);
    }
    callCampaign(companyId, jobId, user, body) {
        return this.scheduling.startCallCampaign(companyId, jobId, user.sub, body.candidateJobIds, body.promptTemplate);
    }
    submitDecision(companyId, candidateJobId, user, body) {
        return this.decisions.submit(companyId, candidateJobId, user.sub, body.outcome, body.reason);
    }
    decisionByToken(token) {
        return this.decisions.getByToken(token);
    }
    createDecisionInvite(companyId, candidateJobId, user) {
        return this.decisionInvites.createInvite(companyId, candidateJobId, user.sub);
    }
    recruiterDecisionView(token) {
        return this.decisionInvites.getInviteView(token);
    }
    recruiterDecisionSubmit(token, body) {
        return this.decisionInvites.submitViaInvite(token, body.outcome, body.reason, body.reviewerName);
    }
    meetAccessView(accessToken) {
        return this.meetAccess.getByToken(accessToken);
    }
};
exports.RecruitmentController = RecruitmentController;
__decorate([
    (0, common_1.Get)('recruitment/plan-features'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER, client_1.UserRole.INTERVIEWER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "planFeaturesForTenant", null);
__decorate([
    (0, common_1.Get)('jobs/:jobId/rounds'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER, client_1.UserRole.INTERVIEWER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "getRounds", null);
__decorate([
    (0, common_1.Patch)('jobs/:jobId/rounds'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'Replace job interview rounds (multi-round pipeline)' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "replaceRounds", null);
__decorate([
    (0, common_1.Get)('jobs/:jobId/sourcing'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "getSourcing", null);
__decorate([
    (0, common_1.Patch)('jobs/:jobId/sourcing'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "patchSourcing", null);
__decorate([
    (0, common_1.Post)('jobs/:jobId/sourcing/ingest'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "ingestResume", null);
__decorate([
    (0, common_1.Post)('jobs/:jobId/sourcing/run'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "runSourcing", null);
__decorate([
    (0, common_1.Post)('jobs/:jobId/schedule/call-campaign'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "callCampaign", null);
__decorate([
    (0, common_1.Post)('candidate-jobs/:candidateJobId/decision'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('candidateJobId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "submitDecision", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('decisions/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "decisionByToken", null);
__decorate([
    (0, common_1.Post)('candidate-jobs/:candidateJobId/decision-invite'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('candidateJobId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "createDecisionInvite", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('recruit/decide/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "recruiterDecisionView", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('recruit/decide/:token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "recruiterDecisionSubmit", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('candidate/meet/:accessToken'),
    __param(0, (0, common_1.Param)('accessToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "meetAccessView", null);
exports.RecruitmentController = RecruitmentController = __decorate([
    (0, swagger_1.ApiTags)('recruitment'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [rounds_service_1.RoundsService,
        sourcing_service_1.SourcingService,
        scheduling_service_1.SchedulingService,
        decisions_service_1.DecisionsService,
        decision_invite_service_1.DecisionInviteService,
        meet_access_service_1.MeetAccessService,
        plan_features_service_1.PlanFeaturesService])
], RecruitmentController);
//# sourceMappingURL=recruitment.controller.js.map
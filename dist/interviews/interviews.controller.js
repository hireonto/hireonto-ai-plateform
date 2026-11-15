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
exports.InterviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const staff_guard_1 = require("../auth/guards/staff.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
const interviews_service_1 = require("./interviews.service");
let InterviewsController = class InterviewsController {
    constructor(interviews) {
        this.interviews = interviews;
    }
    list(companyId, jobId) {
        return this.interviews.list(companyId, jobId);
    }
    fromShortlist(companyId, jobId, body) {
        return this.interviews.createFromShortlist(companyId, jobId, body.candidateJobIds ?? [], body.emails ?? {});
    }
    extend(companyId, interviewId, body) {
        return this.interviews.extend(companyId, interviewId, body.extraHours ?? 24);
    }
    cancel(companyId, interviewId) {
        return this.interviews.cancel(companyId, interviewId);
    }
    resend(companyId, interviewId, body = {}) {
        return this.interviews.resendInvite(companyId, interviewId, body?.email);
    }
};
exports.InterviewsController = InterviewsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER, client_1.UserRole.INTERVIEWER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('jobs/:jobId/from-shortlist'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'Create interviews for shortlisted candidates' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "fromShortlist", null);
__decorate([
    (0, common_1.Patch)(':interviewId/extend'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('interviewId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "extend", null);
__decorate([
    (0, common_1.Patch)(':interviewId/cancel'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('interviewId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':interviewId/resend'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('interviewId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "resend", null);
exports.InterviewsController = InterviewsController = __decorate([
    (0, swagger_1.ApiTags)('interviews'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, common_1.Controller)('interviews'),
    __metadata("design:paramtypes", [interviews_service_1.InterviewsService])
], InterviewsController);
//# sourceMappingURL=interviews.controller.js.map
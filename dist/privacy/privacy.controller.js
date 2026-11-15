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
exports.PrivacyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const staff_guard_1 = require("../auth/guards/staff.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
const privacy_service_1 = require("./privacy.service");
let PrivacyController = class PrivacyController {
    constructor(privacy) {
        this.privacy = privacy;
    }
    retention(companyId) {
        return this.privacy.scheduleRetention(companyId, 30);
    }
    export(companyId, candidateId, user) {
        return this.privacy.exportCandidate(companyId, candidateId, user.sub);
    }
    delete(companyId, candidateId, user) {
        return this.privacy.deleteCandidate(companyId, candidateId, user.sub);
    }
};
exports.PrivacyController = PrivacyController;
__decorate([
    (0, common_1.Post)('retention/run'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Schedule daily recording retention job' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PrivacyController.prototype, "retention", null);
__decorate([
    (0, common_1.Get)('candidates/:candidateId/export'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('candidateId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PrivacyController.prototype, "export", null);
__decorate([
    (0, common_1.Delete)('candidates/:candidateId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('candidateId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PrivacyController.prototype, "delete", null);
exports.PrivacyController = PrivacyController = __decorate([
    (0, swagger_1.ApiTags)('privacy'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, common_1.Controller)('privacy'),
    __metadata("design:paramtypes", [privacy_service_1.PrivacyService])
], PrivacyController);
//# sourceMappingURL=privacy.controller.js.map
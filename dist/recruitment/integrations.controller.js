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
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const staff_guard_1 = require("../auth/guards/staff.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
const integrations_service_1 = require("./integrations.service");
let IntegrationsController = class IntegrationsController {
    constructor(integrations) {
        this.integrations = integrations;
    }
    status(companyId) {
        return this.integrations.status(companyId);
    }
    googleConnect(companyId, user) {
        return this.integrations.startGoogleConnect(companyId, user.sub);
    }
    async googleCallback(code, state, error, res) {
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        if (error || !code) {
            res.redirect(`${appUrl}/settings?connected=google&error=1`);
            return;
        }
        const { redirectUrl } = await this.integrations.handleGoogleCallback(code, state);
        res.redirect(redirectUrl);
    }
    microsoftConnect(companyId, user) {
        return this.integrations.startMicrosoftConnect(companyId, user.sub);
    }
    async microsoftCallback(code, state, error, res) {
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        if (error || !code) {
            res.redirect(`${appUrl}/settings?connected=microsoft&error=1`);
            return;
        }
        const { redirectUrl } = await this.integrations.handleMicrosoftCallback(code, state);
        res.redirect(redirectUrl);
    }
    disconnect(companyId, provider) {
        return this.integrations.disconnect(companyId, provider);
    }
};
exports.IntegrationsController = IntegrationsController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "status", null);
__decorate([
    (0, common_1.Post)('google/connect'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Start Google Calendar OAuth' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "googleConnect", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Query)('error')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.Post)('microsoft/connect'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "microsoftConnect", null);
__decorate([
    (0, common_1.Get)('microsoft/callback'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Query)('error')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "microsoftCallback", null);
__decorate([
    (0, common_1.Post)(':provider/disconnect'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "disconnect", null);
exports.IntegrationsController = IntegrationsController = __decorate([
    (0, swagger_1.ApiTags)('integrations'),
    (0, common_1.Controller)('integrations'),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], IntegrationsController);
//# sourceMappingURL=integrations.controller.js.map
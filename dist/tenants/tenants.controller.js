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
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const staff_guard_1 = require("../auth/guards/staff.guard");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
const update_tenant_dto_1 = require("./dto/update-tenant.dto");
const tenants_service_1 = require("./tenants.service");
let TenantsController = class TenantsController {
    constructor(tenants) {
        this.tenants = tenants;
    }
    current(companyId) {
        return this.tenants.getCompany(companyId);
    }
    branding(companyId, dto) {
        return this.tenants.updateBranding(companyId, dto);
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, common_1.Get)('current'),
    (0, swagger_1.ApiOperation)({ summary: 'Current company, plan, and usage' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "current", null);
__decorate([
    (0, common_1.Patch)('current/branding'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update tenant branding' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tenant_dto_1.UpdateTenantDto]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "branding", null);
exports.TenantsController = TenantsController = __decorate([
    (0, swagger_1.ApiTags)('tenants'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, common_1.Controller)('tenants'),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map
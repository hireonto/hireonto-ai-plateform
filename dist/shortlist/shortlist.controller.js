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
exports.ShortlistController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const staff_guard_1 = require("../auth/guards/staff.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
const shortlist_service_1 = require("./shortlist.service");
let ShortlistController = class ShortlistController {
    constructor(shortlist) {
        this.shortlist = shortlist;
    }
    auto(companyId, jobId) {
        return this.shortlist.autoShortlist(companyId, jobId);
    }
    bulk(companyId, jobId, body) {
        return this.shortlist.bulkAction(companyId, jobId, body.candidateJobIds ?? [], body.action);
    }
    history(companyId, jobId, candidateJobId) {
        return this.shortlist.history(companyId, jobId, candidateJobId);
    }
};
exports.ShortlistController = ShortlistController;
__decorate([
    (0, common_1.Post)('auto'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'Auto-shortlist by fit threshold' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ShortlistController.prototype, "auto", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk shortlist / reject / hold' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ShortlistController.prototype, "bulk", null);
__decorate([
    (0, common_1.Get)(':candidateJobId/history'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER, client_1.UserRole.INTERVIEWER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Param)('candidateJobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ShortlistController.prototype, "history", null);
exports.ShortlistController = ShortlistController = __decorate([
    (0, swagger_1.ApiTags)('shortlist'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, common_1.Controller)('jobs/:jobId/shortlist'),
    __metadata("design:paramtypes", [shortlist_service_1.ShortlistService])
], ShortlistController);
//# sourceMappingURL=shortlist.controller.js.map
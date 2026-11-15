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
exports.ProctoringController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../common/decorators/public.decorator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const staff_guard_1 = require("../auth/guards/staff.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
const proctoring_service_1 = require("./proctoring.service");
let ProctoringController = class ProctoringController {
    constructor(proctoring, prisma) {
        this.proctoring = proctoring;
        this.prisma = prisma;
    }
    async ingest(interviewId, body) {
        await this.assertInterview(interviewId);
        return this.proctoring.ingestBatch(interviewId, body.events ?? []);
    }
    async timeline(companyId, interviewId) {
        await this.assertInterview(interviewId, companyId);
        return this.proctoring.timeline(interviewId);
    }
    async assertInterview(interviewId, companyId) {
        const interview = await this.prisma.interview.findFirst({
            where: {
                id: interviewId,
                deletedAt: null,
                ...(companyId ? { companyId } : {}),
            },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        return interview;
    }
};
exports.ProctoringController = ProctoringController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'REST fallback — batch proctoring events' }),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProctoringController.prototype, "ingest", null);
__decorate([
    (0, common_1.Get)('timeline'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER, client_1.UserRole.INTERVIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Proctoring event timeline' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('interviewId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProctoringController.prototype, "timeline", null);
exports.ProctoringController = ProctoringController = __decorate([
    (0, swagger_1.ApiTags)('proctoring'),
    (0, common_1.Controller)('interviews/:interviewId/proctoring'),
    __metadata("design:paramtypes", [proctoring_service_1.ProctoringService,
        prisma_service_1.PrismaService])
], ProctoringController);
//# sourceMappingURL=proctoring.controller.js.map
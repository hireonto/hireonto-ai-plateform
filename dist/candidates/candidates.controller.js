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
exports.CandidatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const staff_guard_1 = require("../auth/guards/staff.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const candidates_service_1 = require("./candidates.service");
const bulk_upload_dto_1 = require("./dto/bulk-upload.dto");
let CandidatesController = class CandidatesController {
    constructor(candidates) {
        this.candidates = candidates;
    }
    listForJob(companyId, jobId) {
        return this.candidates.listForJob(companyId, jobId);
    }
    profile(companyId, candidateId, user) {
        return this.candidates.getProfileAudited(companyId, candidateId, user.sub);
    }
    bulkPresign(companyId, jobId, dto) {
        return this.candidates.bulkPresign(companyId, jobId, dto.files);
    }
    bulkConfirm(companyId, jobId, dto) {
        return this.candidates.confirmBulkUpload(companyId, jobId, dto.resumeIds);
    }
    tags(companyId, candidateId, body) {
        return this.candidates.updateTags(companyId, candidateId, body.tags ?? []);
    }
    notes(companyId, candidateId, body) {
        return this.candidates.updateNotes(companyId, candidateId, body.notes ?? '');
    }
};
exports.CandidatesController = CandidatesController;
__decorate([
    (0, common_1.Get)('jobs/:jobId/candidates'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER, client_1.UserRole.INTERVIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'List candidates for a job with fit scores' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "listForJob", null);
__decorate([
    (0, common_1.Get)('candidates/:candidateId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER, client_1.UserRole.INTERVIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Candidate profile, resumes, job applications' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('candidateId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "profile", null);
__decorate([
    (0, common_1.Post)('jobs/:jobId/candidates/bulk/presign'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk resume upload — presigned PUT URLs' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, bulk_upload_dto_1.BulkResumeUploadDto]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "bulkPresign", null);
__decorate([
    (0, common_1.Post)('jobs/:jobId/candidates/bulk/confirm'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    (0, swagger_1.ApiOperation)({ summary: 'After S3 upload, enqueue resume parse jobs' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, bulk_upload_dto_1.ConfirmBulkUploadDto]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "bulkConfirm", null);
__decorate([
    (0, common_1.Patch)('candidates/:candidateId/tags'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('candidateId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "tags", null);
__decorate([
    (0, common_1.Patch)('candidates/:candidateId/notes'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('candidateId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "notes", null);
exports.CandidatesController = CandidatesController = __decorate([
    (0, swagger_1.ApiTags)('candidates'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [candidates_service_1.CandidatesService])
], CandidatesController);
//# sourceMappingURL=candidates.controller.js.map
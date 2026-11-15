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
exports.JobsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const staff_guard_1 = require("../auth/guards/staff.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
const create_job_dto_1 = require("./dto/create-job.dto");
const update_job_dto_1 = require("./dto/update-job.dto");
const upload_presign_dto_1 = require("./dto/upload-presign.dto");
const jobs_service_1 = require("./jobs.service");
let JobsController = class JobsController {
    constructor(jobs) {
        this.jobs = jobs;
    }
    list(companyId) {
        return this.jobs.list(companyId);
    }
    create(companyId, user, dto) {
        return this.jobs.create(companyId, dto, user.sub);
    }
    get(companyId, jobId) {
        return this.jobs.get(companyId, jobId);
    }
    update(companyId, jobId, dto) {
        return this.jobs.update(companyId, jobId, dto);
    }
    interviewConfig(companyId, jobId, dto) {
        return this.jobs.upsertInterviewConfig(companyId, jobId, dto);
    }
    presignJd(companyId, jobId, dto) {
        return this.jobs.presignJd(companyId, jobId, dto.fileName, dto.contentType);
    }
    presignQuestionBank(companyId, jobId, dto) {
        return this.jobs.presignQuestionBank(companyId, jobId, dto.fileName, dto.contentType);
    }
};
exports.JobsController = JobsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER, client_1.UserRole.INTERVIEWER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_job_dto_1.CreateJobDto]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':jobId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER, client_1.UserRole.INTERVIEWER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':jobId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_job_dto_1.UpdateJobDto]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':jobId/interview-config'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_job_dto_1.JobInterviewConfigDto]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "interviewConfig", null);
__decorate([
    (0, common_1.Post)(':jobId/jd/presign'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, upload_presign_dto_1.JdPresignDto]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "presignJd", null);
__decorate([
    (0, common_1.Post)(':jobId/question-banks/presign'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, upload_presign_dto_1.QuestionBankPresignDto]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "presignQuestionBank", null);
exports.JobsController = JobsController = __decorate([
    (0, swagger_1.ApiTags)('jobs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, common_1.Controller)('jobs'),
    __metadata("design:paramtypes", [jobs_service_1.JobsService])
], JobsController);
//# sourceMappingURL=jobs.controller.js.map
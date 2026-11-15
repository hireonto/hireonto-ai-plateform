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
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const staff_guard_1 = require("../auth/guards/staff.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const audit_service_1 = require("../common/audit/audit.service");
const media_service_1 = require("./media.service");
let MediaController = class MediaController {
    constructor(media, audit) {
        this.media = media;
        this.audit = audit;
    }
    presignChunk(interviewId, body) {
        return this.media.presignChunk(interviewId, body.streamType, body.chunkIndex, body.contentType);
    }
    confirmChunk(interviewId, body) {
        return this.media.confirmChunk(interviewId, body.streamType, body.chunkIndex, body.storageKey, body.byteSize);
    }
    presignSnapshot(interviewId, body) {
        return this.media.presignSnapshot(interviewId, body.contentType);
    }
    saveSnapshot(interviewId, body) {
        return this.media.saveSnapshot(interviewId, body.storageKey, body.eventType);
    }
    async playback(companyId, interviewId, storageKey, user) {
        await this.audit.log({
            companyId,
            actorId: user.sub,
            action: 'VIEW',
            resourceType: 'media',
            resourceId: interviewId,
            metadata: { storageKey },
        });
        return this.media.playbackUrl(companyId, interviewId, storageKey);
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Post)('chunks/presign'),
    (0, swagger_1.ApiOperation)({ summary: 'Presign chunked recording upload' }),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "presignChunk", null);
__decorate([
    (0, common_1.Post)('chunks/confirm'),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm chunk uploaded to S3' }),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "confirmChunk", null);
__decorate([
    (0, common_1.Post)('snapshots/presign'),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "presignSnapshot", null);
__decorate([
    (0, common_1.Post)('snapshots'),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "saveSnapshot", null);
__decorate([
    (0, common_1.Get)('playback'),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER, client_1.UserRole.INTERVIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Signed playback URL for recording chunk' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('interviewId')),
    __param(2, (0, common_1.Query)('storageKey')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "playback", null);
exports.MediaController = MediaController = __decorate([
    (0, swagger_1.ApiTags)('media'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('sessions/:interviewId/media'),
    __metadata("design:paramtypes", [media_service_1.MediaService,
        audit_service_1.AuditService])
], MediaController);
//# sourceMappingURL=media.controller.js.map
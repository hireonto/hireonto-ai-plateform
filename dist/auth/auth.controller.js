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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../common/decorators/public.decorator");
const auth_service_1 = require("./auth.service");
const accept_invite_dto_1 = require("./dto/accept-invite.dto");
const candidate_magic_link_dto_1 = require("./dto/candidate-magic-link.dto");
const login_dto_1 = require("./dto/login.dto");
const password_reset_dto_1 = require("./dto/password-reset.dto");
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
let AuthController = class AuthController {
    constructor(auth) {
        this.auth = auth;
    }
    staffLogin(dto) {
        return this.auth.staffLogin(dto.email, dto.password);
    }
    refresh(dto) {
        return this.auth.refresh(dto.refreshToken);
    }
    acceptInvite(dto) {
        return this.auth.acceptInvite(dto.token, dto.password);
    }
    requestReset(dto) {
        return this.auth.requestPasswordReset(dto.email);
    }
    confirmReset(dto) {
        return this.auth.resetPassword(dto.token, dto.newPassword);
    }
    candidateMagicLink(dto) {
        return this.auth.candidateMagicLink(dto.email, dto.interviewToken);
    }
    candidateLogin(dto) {
        return this.auth.candidateLogin(dto.token, dto.tempPassword);
    }
    candidateInterviewPreview(accessToken) {
        return this.auth.candidateInterviewPreview(accessToken);
    }
    candidateInterviewLogin(dto) {
        return this.auth.candidateInterviewLogin(dto.accessToken, dto.tempPassword);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('staff/login'),
    (0, swagger_1.ApiOperation)({ summary: 'Staff login (email + password)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.StaffLoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "staffLogin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('staff/refresh'),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh staff access token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('staff/accept-invite'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept recruiter/interviewer invite' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [accept_invite_dto_1.AcceptInviteDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "acceptInvite", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('staff/password-reset/request'),
    (0, swagger_1.ApiOperation)({ summary: 'Request password reset email' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [password_reset_dto_1.RequestPasswordResetDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestReset", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('staff/password-reset/confirm'),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm password reset with token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [password_reset_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "confirmReset", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('candidate/magic-link'),
    (0, swagger_1.ApiOperation)({ summary: 'Send candidate magic login link' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [candidate_magic_link_dto_1.CandidateMagicLinkRequestDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "candidateMagicLink", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('candidate/login'),
    (0, swagger_1.ApiOperation)({ summary: 'Candidate login via magic link (+ optional temp password)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [candidate_magic_link_dto_1.CandidateLoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "candidateLogin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('candidate/interview/:accessToken'),
    (0, swagger_1.ApiOperation)({ summary: 'Public interview preview for the invite link' }),
    __param(0, (0, common_1.Param)('accessToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "candidateInterviewPreview", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('candidate/interview-login'),
    (0, swagger_1.ApiOperation)({ summary: 'Candidate login via invite link token + temp password' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [candidate_magic_link_dto_1.CandidateInterviewLoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "candidateInterviewLogin", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map
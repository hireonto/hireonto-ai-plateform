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
exports.InternalInterviewController = exports.InternalServiceGuard = exports.TranscriptController = exports.ConversationController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const staff_guard_1 = require("../auth/guards/staff.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
const conversation_service_1 = require("./conversation.service");
class ChatMessageDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(8000),
    __metadata("design:type", String)
], ChatMessageDto.prototype, "message", void 0);
class AgentTurnDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['interviewer', 'candidate']),
    __metadata("design:type", String)
], AgentTurnDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], AgentTurnDto.prototype, "text", void 0);
class AgentProctoringDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AgentProctoringDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['info', 'warning', 'strike']),
    __metadata("design:type", String)
], AgentProctoringDto.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], AgentProctoringDto.prototype, "detail", void 0);
class AgentCompleteDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AgentCompleteDto.prototype, "reason", void 0);
function candidateId(user) {
    if (user.aud !== 'candidate') {
        throw new common_1.ForbiddenException('Candidate token required');
    }
    return user.sub;
}
let ConversationController = class ConversationController {
    constructor(conversation) {
        this.conversation = conversation;
    }
    start(interviewId, user) {
        return this.conversation.start(interviewId, candidateId(user));
    }
    ensureAgent(interviewId, user) {
        return this.conversation.ensureVoiceAgent(interviewId, candidateId(user));
    }
    chat(interviewId, user, dto) {
        return this.conversation.chat(interviewId, candidateId(user), dto.message);
    }
};
exports.ConversationController = ConversationController;
__decorate([
    (0, common_1.Post)('start'),
    (0, swagger_1.ApiOperation)({
        summary: 'Start the AI interview: LiveKit voice token, or the text chat if voice is not configured',
    }),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ConversationController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('ensure-agent'),
    (0, swagger_1.ApiOperation)({ summary: 'Voice mode: ask LiveKit to dispatch Tovia into the interview room again' }),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ConversationController.prototype, "ensureAgent", null);
__decorate([
    (0, common_1.Post)('chat'),
    (0, swagger_1.ApiOperation)({ summary: 'Text mode: send a reply, get the interviewer’s next message' }),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, ChatMessageDto]),
    __metadata("design:returntype", void 0)
], ConversationController.prototype, "chat", null);
exports.ConversationController = ConversationController = __decorate([
    (0, swagger_1.ApiTags)('conversation'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('sessions/:interviewId/conversation'),
    __metadata("design:paramtypes", [conversation_service_1.ConversationService])
], ConversationController);
let TranscriptController = class TranscriptController {
    constructor(conversation) {
        this.conversation = conversation;
    }
    plan(companyId, interviewId) {
        return this.conversation.planForStaff(companyId, interviewId);
    }
    transcript(companyId, interviewId) {
        return this.conversation.transcriptForStaff(companyId, interviewId);
    }
};
exports.TranscriptController = TranscriptController;
__decorate([
    (0, common_1.Get)('plan'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER, client_1.UserRole.INTERVIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'RAG question plan generated for this interview' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('interviewId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TranscriptController.prototype, "plan", null);
__decorate([
    (0, common_1.Get)('transcript'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RECRUITER, client_1.UserRole.INTERVIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'Interviewer/candidate conversation turns' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('interviewId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TranscriptController.prototype, "transcript", null);
exports.TranscriptController = TranscriptController = __decorate([
    (0, swagger_1.ApiTags)('conversation'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, common_1.Controller)('interviews/:interviewId'),
    __metadata("design:paramtypes", [conversation_service_1.ConversationService])
], TranscriptController);
let InternalServiceGuard = class InternalServiceGuard {
    constructor(jwt, config) {
        this.jwt = jwt;
        this.config = config;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
        if (!token) {
            throw new common_1.UnauthorizedException();
        }
        try {
            await this.jwt.verifyAsync(token, {
                secret: this.config.get('jwt.internalSecret'),
                audience: 'hiremind-backend',
            });
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid internal token');
        }
    }
};
exports.InternalServiceGuard = InternalServiceGuard;
exports.InternalServiceGuard = InternalServiceGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], InternalServiceGuard);
let InternalInterviewController = class InternalInterviewController {
    constructor(conversation) {
        this.conversation = conversation;
    }
    context(interviewId) {
        return this.conversation.context(interviewId);
    }
    async turn(interviewId, dto) {
        await this.conversation.addTurn(interviewId, dto.role, dto.text);
        return { ok: true };
    }
    proctoring(interviewId, dto) {
        return this.conversation.agentProctoringEvent(interviewId, dto.eventType, dto.severity, dto.detail);
    }
    complete(interviewId, dto) {
        return this.conversation.complete(interviewId, dto.reason);
    }
};
exports.InternalInterviewController = InternalInterviewController;
__decorate([
    (0, common_1.Get)('context'),
    __param(0, (0, common_1.Param)('interviewId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InternalInterviewController.prototype, "context", null);
__decorate([
    (0, common_1.Post)('turns'),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AgentTurnDto]),
    __metadata("design:returntype", Promise)
], InternalInterviewController.prototype, "turn", null);
__decorate([
    (0, common_1.Post)('proctoring'),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AgentProctoringDto]),
    __metadata("design:returntype", void 0)
], InternalInterviewController.prototype, "proctoring", null);
__decorate([
    (0, common_1.Post)('complete'),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AgentCompleteDto]),
    __metadata("design:returntype", void 0)
], InternalInterviewController.prototype, "complete", null);
exports.InternalInterviewController = InternalInterviewController = __decorate([
    (0, swagger_1.ApiExcludeController)(),
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(InternalServiceGuard),
    (0, common_1.Controller)('internal/interviews/:interviewId'),
    __metadata("design:paramtypes", [conversation_service_1.ConversationService])
], InternalInterviewController);
//# sourceMappingURL=conversation.controller.js.map
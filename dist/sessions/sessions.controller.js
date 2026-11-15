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
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const sessions_service_1 = require("./sessions.service");
let SessionsController = class SessionsController {
    constructor(sessions) {
        this.sessions = sessions;
    }
    candidateId(user) {
        if (user.aud !== 'candidate') {
            throw new common_1.ForbiddenException('Candidate token required');
        }
        return user.sub;
    }
    start(interviewId, user) {
        return this.sessions.start(interviewId, this.candidateId(user));
    }
    next(interviewId, user) {
        return this.sessions.nextQuestion(interviewId, this.candidateId(user));
    }
    answer(interviewId, questionId, user, body) {
        return this.sessions.submitAnswer(interviewId, this.candidateId(user), questionId, body);
    }
    followUp(interviewId, questionId, user) {
        return this.sessions.requestFollowUp(interviewId, this.candidateId(user), questionId);
    }
    reconnect(interviewId, user) {
        return this.sessions.reconnect(interviewId, this.candidateId(user));
    }
    finish(interviewId, user) {
        return this.sessions.finish(interviewId, this.candidateId(user));
    }
    sttToken(interviewId, user) {
        return this.sessions.sttToken(interviewId, this.candidateId(user));
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Post)('start'),
    (0, swagger_1.ApiOperation)({ summary: 'Start interview session' }),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "start", null);
__decorate([
    (0, common_1.Get)('next-question'),
    (0, swagger_1.ApiOperation)({ summary: 'Get next unanswered question' }),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "next", null);
__decorate([
    (0, common_1.Post)('questions/:questionId/answer'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit answer (text/transcript/code)' }),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, common_1.Param)('questionId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "answer", null);
__decorate([
    (0, common_1.Post)('questions/:questionId/follow-up'),
    (0, swagger_1.ApiOperation)({ summary: 'Request AI follow-up question' }),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, common_1.Param)('questionId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "followUp", null);
__decorate([
    (0, common_1.Post)('reconnect'),
    (0, swagger_1.ApiOperation)({ summary: 'One reconnect within 5 minutes' }),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "reconnect", null);
__decorate([
    (0, common_1.Post)('finish'),
    (0, swagger_1.ApiOperation)({ summary: 'Finish interview' }),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "finish", null);
__decorate([
    (0, common_1.Post)('stt-token'),
    (0, swagger_1.ApiOperation)({ summary: '2-minute signed STT stream token' }),
    __param(0, (0, common_1.Param)('interviewId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "sttToken", null);
exports.SessionsController = SessionsController = __decorate([
    (0, swagger_1.ApiTags)('sessions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('sessions/:interviewId'),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService])
], SessionsController);
//# sourceMappingURL=sessions.controller.js.map
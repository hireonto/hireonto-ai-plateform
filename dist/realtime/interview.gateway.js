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
var InterviewGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewGateway = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const proctoring_service_1 = require("../proctoring/proctoring.service");
const sessions_service_1 = require("../sessions/sessions.service");
const HEARTBEAT_TIMEOUT_MS = 30_000;
let InterviewGateway = InterviewGateway_1 = class InterviewGateway {
    constructor(jwt, config, proctoring, sessions) {
        this.jwt = jwt;
        this.config = config;
        this.proctoring = proctoring;
        this.sessions = sessions;
        this.logger = new common_1.Logger(InterviewGateway_1.name);
        this.heartbeats = new Map();
        this.interviewBySocket = new Map();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ??
                client.handshake.query?.token;
            const payload = await this.jwt.verifyAsync(token, {
                secret: this.config.get('jwt.accessSecret'),
            });
            if (payload.aud !== 'candidate') {
                client.disconnect();
                return;
            }
            const interviewId = client.handshake.query?.interviewId;
            client.data.user = payload;
            client.data.interviewId = interviewId;
            this.interviewBySocket.set(client.id, interviewId);
            this.resetHeartbeat(client);
            client.join(`interview:${interviewId}`);
        }
        catch {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const t = this.heartbeats.get(client.id);
        if (t) {
            clearTimeout(t);
        }
        this.heartbeats.delete(client.id);
        this.interviewBySocket.delete(client.id);
    }
    onHeartbeat(client) {
        this.resetHeartbeat(client);
        return { ok: true };
    }
    async onProctoring(client, body) {
        const interviewId = client.data.interviewId;
        const result = await this.proctoring.ingestBatch(interviewId, body.events ?? []);
        if (result.terminated) {
            this.server.to(`interview:${interviewId}`).emit('terminated', {
                reason: 'strike_limit',
            });
        }
        this.server.to(`recruiter:${interviewId}`).emit('proctoring_flag', result);
        return result;
    }
    async onNext(client) {
        const interviewId = client.data.interviewId;
        const candidateId = client.data.user.sub;
        const next = await this.sessions.nextQuestion(interviewId, candidateId);
        client.emit('next_question', next);
        return next;
    }
    resetHeartbeat(client) {
        const existing = this.heartbeats.get(client.id);
        if (existing) {
            clearTimeout(existing);
        }
        const timer = setTimeout(() => {
            void this.onMissedHeartbeat(client);
        }, HEARTBEAT_TIMEOUT_MS);
        this.heartbeats.set(client.id, timer);
    }
    async onMissedHeartbeat(client) {
        const interviewId = client.data.interviewId;
        if (!interviewId) {
            return;
        }
        await this.proctoring.recordDisconnect(interviewId);
        this.server.to(`interview:${interviewId}`).emit('warning', {
            code: 'DISCONNECTED',
            message: 'Heartbeat missed',
        });
        this.logger.warn(`Heartbeat timeout interview=${interviewId}`);
    }
};
exports.InterviewGateway = InterviewGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], InterviewGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('heartbeat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], InterviewGateway.prototype, "onHeartbeat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('proctoring_batch'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], InterviewGateway.prototype, "onProctoring", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('request_next'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], InterviewGateway.prototype, "onNext", null);
exports.InterviewGateway = InterviewGateway = InterviewGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/interview',
        cors: { origin: true },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        proctoring_service_1.ProctoringService,
        sessions_service_1.SessionsService])
], InterviewGateway);
//# sourceMappingURL=interview.gateway.js.map
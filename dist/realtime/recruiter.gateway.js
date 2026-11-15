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
var RecruiterGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruiterGateway = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("../prisma/prisma.service");
let RecruiterGateway = RecruiterGateway_1 = class RecruiterGateway {
    constructor(jwt, config, prisma) {
        this.jwt = jwt;
        this.config = config;
        this.prisma = prisma;
        this.logger = new common_1.Logger(RecruiterGateway_1.name);
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ??
                client.handshake.query?.token;
            const payload = await this.jwt.verifyAsync(token, {
                secret: this.config.get('jwt.accessSecret'),
            });
            if (payload.aud !== 'staff') {
                client.disconnect();
                return;
            }
            client.data.user = payload;
        }
        catch {
            client.disconnect();
        }
    }
    async watch(client, body) {
        const companyId = client.data.user.companyId;
        const interview = await this.prisma.interview.findFirst({
            where: { id: body.interviewId, companyId },
        });
        if (!interview) {
            return { error: 'not_found' };
        }
        client.join(`recruiter:${body.interviewId}`);
        return { watching: body.interviewId };
    }
    async dashboard(client) {
        const companyId = client.data.user.companyId;
        client.join(`company:${companyId}`);
        const counts = await this.prisma.interview.groupBy({
            by: ['status'],
            where: { companyId, deletedAt: null },
            _count: true,
        });
        return { counts };
    }
    emitLiveTranscript(interviewId, segment) {
        this.server.to(`recruiter:${interviewId}`).emit('live_transcript', segment);
    }
    emitCompanyCounter(companyId, payload) {
        this.server.to(`company:${companyId}`).emit('live_counters', payload);
    }
};
exports.RecruiterGateway = RecruiterGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RecruiterGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('watch_interview'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], RecruiterGateway.prototype, "watch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('dashboard_subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], RecruiterGateway.prototype, "dashboard", null);
exports.RecruiterGateway = RecruiterGateway = RecruiterGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/recruiter',
        cors: { origin: true },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], RecruiterGateway);
//# sourceMappingURL=recruiter.gateway.js.map
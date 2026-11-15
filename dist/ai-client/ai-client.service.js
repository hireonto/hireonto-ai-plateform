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
var AiClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let AiClientService = AiClientService_1 = class AiClientService {
    constructor(config, jwt, prisma) {
        this.config = config;
        this.jwt = jwt;
        this.prisma = prisma;
        this.logger = new common_1.Logger(AiClientService_1.name);
        this.failures = 0;
        this.circuitOpenUntil = 0;
    }
    async parseResume(req) {
        if (this.config.get('ai.fakeMode')) {
            return {
                text: `FAKE PARSED RESUME for ${req.storageKey}\nSkills: Node.js, TypeScript, PostgreSQL`,
            };
        }
        return this.post('/v1/resume/parse', req, req.companyId, 'parse_resume');
    }
    async scoreFit(req) {
        if (this.config.get('ai.fakeMode')) {
            const score = 0.65 + Math.random() * 0.3;
            return {
                score: Math.round(score * 100) / 100,
                explanation: 'FAKE_MODE: Strong backend alignment with job requirements.',
            };
        }
        return this.post('/v1/fit/score', req, req.companyId, 'fit_score');
    }
    chatTurn(companyId, context, history) {
        return this.post('/v1/interview/chat', { context, history }, companyId, 'interview_chat');
    }
    planInterview(companyId, interviewId, context) {
        return this.post('/v1/interview/plan', { context }, companyId, 'interview_plan', interviewId);
    }
    async voiceReady() {
        try {
            const res = await fetch(`${this.config.get('ai.serviceUrl')}/health`, {
                signal: AbortSignal.timeout(2000),
            });
            const body = (await res.json());
            return Boolean(body.voiceReady);
        }
        catch {
            return false;
        }
    }
    evaluateInterview(companyId, context, transcript, integrityEvents = []) {
        return this.post('/v1/interview/evaluate', { context, transcript, integrity_events: integrityEvents }, companyId, 'interview_evaluation');
    }
    async post(path, body, companyId, operation, interviewId) {
        if (Date.now() < this.circuitOpenUntil) {
            throw new Error('AI service circuit open');
        }
        const baseUrl = this.config.get('ai.serviceUrl');
        const token = await this.internalToken(companyId);
        const run = await this.prisma.aiRun.create({
            data: {
                companyId,
                interviewId,
                operation,
                status: client_1.AiRunStatus.RUNNING,
                requestPayload: body,
            },
        });
        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const res = await fetch(`${baseUrl}${path}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(body),
                });
                if (!res.ok) {
                    throw new Error(`AI ${path} failed: ${res.status}`);
                }
                const data = (await res.json());
                this.failures = 0;
                await this.prisma.aiRun.update({
                    where: { id: run.id },
                    data: {
                        status: client_1.AiRunStatus.SUCCEEDED,
                        responseSummary: data,
                    },
                });
                return data;
            }
            catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                this.logger.warn(`AI attempt ${attempt} failed: ${lastError.message}`);
                await new Promise((r) => setTimeout(r, attempt * 200));
            }
        }
        this.failures += 1;
        if (this.failures >= 5) {
            this.circuitOpenUntil = Date.now() + 30_000;
        }
        await this.prisma.aiRun.update({
            where: { id: run.id },
            data: {
                status: client_1.AiRunStatus.FAILED,
                error: lastError?.message,
            },
        });
        throw lastError ?? new Error('AI request failed');
    }
    internalToken(companyId) {
        return this.jwt.signAsync({ sub: 'hiremind-backend', companyId, aud: 'ai-service' }, {
            secret: this.config.get('jwt.internalSecret'),
            expiresIn: '5m',
        });
    }
};
exports.AiClientService = AiClientService;
exports.AiClientService = AiClientService = AiClientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AiClientService);
//# sourceMappingURL=ai-client.service.js.map
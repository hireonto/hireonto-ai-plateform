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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(WebhooksService_1.name);
    }
    async ingestAiWebhook(dto) {
        const webhook = await this.prisma.webhook.create({
            data: {
                companyId: dto.companyId,
                source: 'hiremind-ai',
                eventType: dto.eventType,
                payload: dto.payload,
                status: client_1.WebhookStatus.PENDING,
            },
        });
        try {
            await this.dispatch(dto);
            await this.prisma.webhook.update({
                where: { id: webhook.id },
                data: { status: client_1.WebhookStatus.DELIVERED, processedAt: new Date() },
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Webhook ${webhook.id} failed: ${message}`);
            await this.prisma.webhook.update({
                where: { id: webhook.id },
                data: { status: client_1.WebhookStatus.FAILED, error: message },
            });
            throw err;
        }
        return { received: true, id: webhook.id };
    }
    async dispatch(dto) {
        switch (dto.eventType) {
            case 'evaluation.completed':
                if (dto.interviewId && dto.payload) {
                    await this.prisma.evaluationReport.upsert({
                        where: { interviewId: dto.interviewId },
                        create: {
                            interviewId: dto.interviewId,
                            overallScore: Number(dto.payload.overallScore ?? 0),
                            recommendation: String(dto.payload.recommendation ?? ''),
                            summary: String(dto.payload.summary ?? ''),
                            details: dto.payload,
                        },
                        update: {
                            overallScore: Number(dto.payload.overallScore ?? 0),
                            recommendation: String(dto.payload.recommendation ?? ''),
                            summary: String(dto.payload.summary ?? ''),
                            details: dto.payload,
                        },
                    });
                }
                break;
            case 'proctoring.analysis.completed':
                if (dto.interviewId) {
                    await this.prisma.integrityReport.upsert({
                        where: { interviewId: dto.interviewId },
                        create: {
                            interviewId: dto.interviewId,
                            summary: dto.payload,
                            riskScore: Number(dto.payload.riskScore ?? 0),
                            flags: dto.payload.flags ?? [],
                        },
                        update: {
                            summary: dto.payload,
                            riskScore: Number(dto.payload.riskScore ?? 0),
                            flags: dto.payload.flags ?? [],
                        },
                    });
                }
                break;
            default:
                this.logger.debug(`Unhandled AI webhook: ${dto.eventType}`);
        }
        if (dto.externalId) {
            await this.prisma.aiRun.updateMany({
                where: { externalId: dto.externalId },
                data: {
                    responseSummary: dto.payload,
                },
            });
        }
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map
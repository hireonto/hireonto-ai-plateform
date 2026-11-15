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
exports.TwilioWebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const public_decorator_1 = require("../common/decorators/public.decorator");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const pstn_service_1 = require("./pstn.service");
const scheduling_service_1 = require("./scheduling.service");
let TwilioWebhookController = class TwilioWebhookController {
    constructor(pstn, prisma, scheduling, config) {
        this.pstn = pstn;
        this.prisma = prisma;
        this.scheduling = scheduling;
        this.config = config;
    }
    async outbound(callId, res) {
        const call = await this.prisma.outboundCall.findUnique({
            where: { id: callId },
            include: { campaign: true },
        });
        if (!call) {
            res.type('text/xml').send(this.pstn.buildDeclineTwiml());
            return;
        }
        const base = this.config.get('backendPublicUrl').replace(/\/$/, '');
        const gatherUrl = `${base}/webhooks/twilio/gather?callId=${encodeURIComponent(callId)}`;
        const twiml = this.pstn.buildOutboundTwiml(callId, call.campaign.promptTemplate, gatherUrl);
        res.type('text/xml').send(twiml);
    }
    async gather(callId, body, res) {
        const digit = body.Digits?.trim();
        const call = await this.prisma.outboundCall.findUnique({
            where: { id: callId },
            include: { candidateJob: { include: { candidate: true, job: true } }, campaign: true },
        });
        if (!call?.candidateJob) {
            res.type('text/xml').send(this.pstn.buildDeclineTwiml());
            return;
        }
        if (digit !== '1') {
            await this.prisma.outboundCall.update({
                where: { id: callId },
                data: { status: client_1.OutboundCallStatus.COMPLETED, transcript: 'Candidate declined or no input' },
            });
            await this.scheduling.maybeCompleteCampaignForCall(callId);
            res.type('text/xml').send(this.pstn.buildDeclineTwiml());
            return;
        }
        const proposed = new Date(Date.now() + 48 * 3600_000);
        await this.prisma.outboundCall.update({
            where: { id: callId },
            data: {
                status: client_1.OutboundCallStatus.SCHEDULED,
                proposedSlot: proposed,
                transcript: `Confirmed via PSTN (digit 1). Prompt: ${call.campaign.promptTemplate.slice(0, 120)}…`,
            },
        });
        await this.scheduling.confirmSchedule(call.campaign.companyId, call.candidateJobId, call.campaign.jobId, proposed, call.candidateJob.candidate.email);
        await this.scheduling.maybeCompleteCampaignForCall(callId);
        res.type('text/xml').send(this.pstn.buildConfirmTwiml());
    }
    async status(callId, body) {
        if (!callId)
            return { ok: true };
        const st = body.CallStatus;
        if (st === 'no-answer' || st === 'busy' || st === 'failed' || st === 'canceled') {
            await this.prisma.outboundCall.updateMany({
                where: { id: callId, status: client_1.OutboundCallStatus.DIALING },
                data: {
                    status: client_1.OutboundCallStatus.NO_ANSWER,
                    error: st,
                },
            });
            await this.scheduling.maybeCompleteCampaignForCall(callId);
        }
        return { ok: true };
    }
};
exports.TwilioWebhookController = TwilioWebhookController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('outbound'),
    (0, swagger_1.ApiOperation)({ summary: 'Twilio voice TwiML for outbound scheduling calls' }),
    __param(0, (0, common_1.Query)('callId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TwilioWebhookController.prototype, "outbound", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('gather'),
    __param(0, (0, common_1.Query)('callId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TwilioWebhookController.prototype, "gather", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('status'),
    __param(0, (0, common_1.Query)('callId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TwilioWebhookController.prototype, "status", null);
exports.TwilioWebhookController = TwilioWebhookController = __decorate([
    (0, swagger_1.ApiTags)('webhooks'),
    (0, common_1.Controller)('webhooks/twilio'),
    __metadata("design:paramtypes", [pstn_service_1.PstnService,
        prisma_service_1.PrismaService,
        scheduling_service_1.SchedulingService,
        config_1.ConfigService])
], TwilioWebhookController);
//# sourceMappingURL=twilio-webhook.controller.js.map
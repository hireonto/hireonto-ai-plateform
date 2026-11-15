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
var PstnService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PstnService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let PstnService = PstnService_1 = class PstnService {
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
        this.logger = new common_1.Logger(PstnService_1.name);
    }
    isConfigured() {
        return !!(this.config.get('twilio.accountSid') &&
            this.config.get('twilio.authToken') &&
            this.config.get('twilio.fromNumber') &&
            this.config.get('backendPublicUrl'));
    }
    async dialOutbound(callId, phone) {
        if (!phone?.trim()) {
            await this.prisma.outboundCall.update({
                where: { id: callId },
                data: { status: client_1.OutboundCallStatus.FAILED, error: 'No phone number on candidate' },
            });
            return false;
        }
        if (!this.isConfigured()) {
            return false;
        }
        const sid = this.config.get('twilio.accountSid');
        const token = this.config.get('twilio.authToken');
        const from = this.config.get('twilio.fromNumber');
        const base = this.config.get('backendPublicUrl').replace(/\/$/, '');
        const voiceUrl = `${base}/webhooks/twilio/outbound?callId=${encodeURIComponent(callId)}`;
        const statusUrl = `${base}/webhooks/twilio/status?callId=${encodeURIComponent(callId)}`;
        const body = new URLSearchParams({
            To: phone,
            From: from,
            Url: voiceUrl,
            Method: 'POST',
            StatusCallback: statusUrl,
            StatusCallbackMethod: 'POST',
            StatusCallbackEvent: 'completed',
            MachineDetection: 'Enable',
        });
        const auth = Buffer.from(`${sid}:${token}`).toString('base64');
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
        });
        const json = (await res.json());
        if (!res.ok) {
            this.logger.warn(`Twilio dial failed: ${json.message ?? res.statusText}`);
            await this.prisma.outboundCall.update({
                where: { id: callId },
                data: { status: client_1.OutboundCallStatus.FAILED, error: json.message ?? 'Twilio dial failed' },
            });
            return false;
        }
        await this.prisma.outboundCall.update({
            where: { id: callId },
            data: { status: client_1.OutboundCallStatus.DIALING, transcript: `twilio:${json.sid}` },
        });
        return true;
    }
    buildOutboundTwiml(callId, prompt, gatherUrl) {
        const say = this.escapeXml(prompt.slice(0, 1200));
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${say}</Say>
  <Gather numDigits="1" action="${this.escapeXml(gatherUrl)}" method="POST" timeout="8">
    <Say voice="Polly.Joanna">Press 1 to confirm an interview slot in the next 48 hours, or press 2 to decline.</Say>
  </Gather>
  <Say voice="Polly.Joanna">We did not receive input. Goodbye.</Say>
</Response>`;
    }
    buildDeclineTwiml() {
        return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Thank you. Goodbye.</Say></Response>`;
    }
    buildConfirmTwiml() {
        return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Great, your interview is scheduled. You will receive a confirmation email shortly. Goodbye.</Say></Response>`;
    }
    escapeXml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }
};
exports.PstnService = PstnService;
exports.PstnService = PstnService = PstnService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], PstnService);
//# sourceMappingURL=pstn.service.js.map
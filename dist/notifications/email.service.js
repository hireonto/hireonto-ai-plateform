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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = require("nodemailer");
const prisma_service_1 = require("../prisma/prisma.service");
let EmailService = EmailService_1 = class EmailService {
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmailService_1.name);
    }
    async send(input) {
        const log = await this.prisma.emailLog.create({
            data: {
                companyId: input.companyId,
                to: input.to,
                subject: input.subject,
                template: input.template,
                metadata: (input.metadata ?? {}),
                status: 'queued',
            },
        });
        const host = this.config.get('email.smtp.host');
        const port = this.config.get('email.smtp.port');
        this.logger.log(`[${input.template}] → ${input.to} (smtp://${host}:${port}) subject="${input.subject}"`);
        try {
            this.transporter ??= (0, nodemailer_1.createTransport)({ host, port, secure: port === 465 });
            const info = await this.transporter.sendMail({
                from: this.config.get('email.from') ?? 'HireMind <no-reply@hiremind.local>',
                to: input.to,
                subject: input.subject,
                html: input.html,
            });
            await this.prisma.emailLog.update({
                where: { id: log.id },
                data: { status: 'sent', sentAt: new Date(), providerId: info.messageId },
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Email to ${input.to} failed: ${message}`);
            await this.prisma.emailLog.update({
                where: { id: log.id },
                data: { status: 'failed', error: message },
            });
            return { id: log.id, sent: false };
        }
        return { id: log.id, sent: true };
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], EmailService);
//# sourceMappingURL=email.service.js.map
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
var PrivacyProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const privacy_constants_1 = require("./privacy.constants");
let PrivacyProcessor = PrivacyProcessor_1 = class PrivacyProcessor extends bullmq_1.WorkerHost {
    constructor(prisma) {
        super();
        this.prisma = prisma;
        this.logger = new common_1.Logger(PrivacyProcessor_1.name);
    }
    async process(job) {
        const days = job.data.recordingRetentionDays;
        const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
        const chunks = await this.prisma.mediaChunk.findMany({
            where: {
                uploadedAt: { lt: cutoff },
                ...(job.data.companyId
                    ? { interview: { companyId: job.data.companyId } }
                    : {}),
            },
            take: 500,
        });
        const deleted = await this.prisma.mediaChunk.deleteMany({
            where: { id: { in: chunks.map((c) => c.id) } },
        });
        this.logger.log(`Retention deleted ${deleted.count} media chunks`);
        return { deleted: deleted.count };
    }
};
exports.PrivacyProcessor = PrivacyProcessor;
exports.PrivacyProcessor = PrivacyProcessor = PrivacyProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(privacy_constants_1.PRIVACY_QUEUE),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrivacyProcessor);
//# sourceMappingURL=privacy.processor.js.map
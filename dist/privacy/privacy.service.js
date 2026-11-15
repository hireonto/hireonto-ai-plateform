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
exports.PrivacyService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const client_1 = require("@prisma/client");
const audit_service_1 = require("../common/audit/audit.service");
const prisma_service_1 = require("../prisma/prisma.service");
const privacy_constants_1 = require("./privacy.constants");
let PrivacyService = class PrivacyService {
    constructor(prisma, audit, queue) {
        this.prisma = prisma;
        this.audit = audit;
        this.queue = queue;
    }
    scheduleRetention(companyId, recordingRetentionDays) {
        return this.queue.add('retention', { companyId, recordingRetentionDays }, { repeat: { every: 24 * 3600 * 1000 } });
    }
    async exportCandidate(companyId, candidateId, actorId) {
        const candidate = await this.prisma.candidate.findFirst({
            where: { id: candidateId, companyId, deletedAt: null },
            include: {
                resumes: true,
                candidateJobs: true,
                interviews: {
                    include: {
                        questions: { include: { answers: true } },
                        evaluationReport: true,
                        integrityReport: true,
                    },
                },
            },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        await this.audit.log({
            companyId,
            actorId,
            action: client_1.AuditAction.EXPORT,
            resourceType: 'candidate',
            resourceId: candidateId,
        });
        return candidate;
    }
    async deleteCandidate(companyId, candidateId, actorId) {
        const candidate = await this.prisma.candidate.findFirst({
            where: { id: candidateId, companyId, deletedAt: null },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        const now = new Date();
        await this.prisma.candidate.update({
            where: { id: candidateId },
            data: { deletedAt: now, email: null, phone: null },
        });
        await this.audit.log({
            companyId,
            actorId,
            action: client_1.AuditAction.DELETE,
            resourceType: 'candidate',
            resourceId: candidateId,
        });
        return { deleted: true };
    }
};
exports.PrivacyService = PrivacyService;
exports.PrivacyService = PrivacyService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)(privacy_constants_1.PRIVACY_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        bullmq_2.Queue])
], PrivacyService);
//# sourceMappingURL=privacy.service.js.map
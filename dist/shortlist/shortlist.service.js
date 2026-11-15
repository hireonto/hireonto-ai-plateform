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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortlistService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let ShortlistService = class ShortlistService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async autoShortlist(companyId, jobId) {
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, companyId, deletedAt: null },
        });
        if (!job) {
            return { updated: 0 };
        }
        const threshold = job.autoShortlistThreshold ?? 0.7;
        const rows = await this.prisma.candidateJob.findMany({
            where: {
                companyId,
                jobId,
                deletedAt: null,
                status: client_1.CandidateJobStatus.PARSED,
                fitScore: { gte: threshold },
            },
        });
        let updated = 0;
        for (const row of rows) {
            await this.prisma.candidateJob.update({
                where: { id: row.id },
                data: {
                    status: client_1.CandidateJobStatus.SHORTLISTED,
                    shortlistedAt: new Date(),
                    history: this.appendHistory(row.history, 'auto_shortlist', {
                        threshold,
                        fitScore: row.fitScore,
                    }),
                },
            });
            updated += 1;
        }
        return { updated, threshold };
    }
    async bulkAction(companyId, jobId, candidateJobIds, action) {
        const statusMap = {
            shortlist: client_1.CandidateJobStatus.SHORTLISTED,
            reject: client_1.CandidateJobStatus.REJECTED,
            hold: client_1.CandidateJobStatus.ON_HOLD,
        };
        const now = new Date();
        const data = {
            status: statusMap[action],
            history: undefined,
        };
        if (action === 'shortlist') {
            data.shortlistedAt = now;
        }
        if (action === 'reject') {
            data.rejectedAt = now;
        }
        if (action === 'hold') {
            data.holdAt = now;
        }
        let count = 0;
        for (const id of candidateJobIds) {
            const row = await this.prisma.candidateJob.findFirst({
                where: { id, companyId, jobId, deletedAt: null },
            });
            if (!row) {
                continue;
            }
            await this.prisma.candidateJob.update({
                where: { id },
                data: {
                    ...data,
                    history: this.appendHistory(row.history, `manual_${action}`, {}),
                },
            });
            count += 1;
        }
        return { count, action };
    }
    history(companyId, jobId, candidateJobId) {
        return this.prisma.candidateJob.findFirst({
            where: { id: candidateJobId, companyId, jobId },
            select: { id: true, status: true, history: true, fitScore: true },
        });
    }
    appendHistory(current, event, meta) {
        const list = Array.isArray(current) ? [...current] : [];
        list.push({ at: new Date().toISOString(), event, ...meta });
        return list;
    }
};
exports.ShortlistService = ShortlistService;
exports.ShortlistService = ShortlistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShortlistService);
//# sourceMappingURL=shortlist.service.js.map
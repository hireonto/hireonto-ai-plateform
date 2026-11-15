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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async funnel(companyId, jobId) {
        const where = { companyId, ...(jobId ? { jobId } : {}) };
        const statuses = await this.prisma.candidateJob.groupBy({
            by: ['status'],
            where: { ...where, deletedAt: null },
            _count: true,
        });
        return { funnel: statuses };
    }
    async perJob(companyId) {
        const jobs = await this.prisma.job.findMany({
            where: { companyId, deletedAt: null },
            select: {
                id: true,
                title: true,
                candidateJobs: {
                    where: { deletedAt: null },
                    select: { status: true, fitScore: true },
                },
                interviews: {
                    where: { deletedAt: null },
                    select: { status: true },
                },
            },
        });
        return jobs.map((j) => ({
            jobId: j.id,
            title: j.title,
            candidates: j.candidateJobs.length,
            avgFit: j.candidateJobs.filter((c) => c.fitScore != null).reduce((a, c) => a + (c.fitScore ?? 0), 0) / Math.max(1, j.candidateJobs.filter((c) => c.fitScore != null).length),
            interviews: j.interviews.length,
            completedInterviews: j.interviews.filter((i) => i.status === 'COMPLETED')
                .length,
        }));
    }
    async perRecruiter(companyId) {
        const users = await this.prisma.user.findMany({
            where: { companyId, role: { in: ['ADMIN', 'RECRUITER'] }, deletedAt: null },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
            },
        });
        const jobs = await this.prisma.job.groupBy({
            by: ['createdById'],
            where: { companyId, deletedAt: null, createdById: { not: null } },
            _count: true,
        });
        return users.map((u) => ({
            user: u,
            jobsCreated: jobs.find((g) => g.createdById === u.id)?._count ?? 0,
        }));
    }
    async integrity(companyId) {
        const reports = await this.prisma.integrityReport.findMany({
            where: { interview: { companyId } },
            select: { riskScore: true, interviewId: true },
        });
        const avgRisk = reports.reduce((a, r) => a + (r.riskScore ?? 0), 0) /
            Math.max(1, reports.length);
        const terminated = await this.prisma.interview.count({
            where: { companyId, status: 'TERMINATED' },
        });
        return { avgRisk, terminatedCount: terminated, sampleSize: reports.length };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map
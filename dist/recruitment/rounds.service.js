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
exports.RoundsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const plan_features_service_1 = require("./plan-features.service");
const DEFAULT_ROUNDS = [
    { label: 'L1 Technical (AI)', roundType: client_1.JobRoundType.L1_AI, conductor: client_1.RoundConductor.AI, meetProvider: client_1.MeetProvider.LIVEKIT, durationMinutes: 45 },
];
let RoundsService = class RoundsService {
    constructor(prisma, planFeatures) {
        this.prisma = prisma;
        this.planFeatures = planFeatures;
    }
    async list(companyId, jobId) {
        await this.assertJob(companyId, jobId);
        await this.ensureDefaults(jobId);
        return this.prisma.jobRound.findMany({ where: { jobId }, orderBy: { orderIndex: 'asc' } });
    }
    async replace(companyId, jobId, rounds) {
        await this.planFeatures.require(companyId, 'multi_round');
        await this.assertJob(companyId, jobId);
        if (!rounds.length)
            throw new common_1.BadRequestException('At least one round is required');
        await this.prisma.jobRound.deleteMany({ where: { jobId } });
        await this.prisma.jobRound.createMany({
            data: rounds.map((r, orderIndex) => ({
                jobId,
                orderIndex,
                label: r.label,
                roundType: r.roundType,
                conductor: r.conductor,
                meetProvider: r.meetProvider ?? client_1.MeetProvider.LIVEKIT,
                durationMinutes: r.durationMinutes ?? 45,
            })),
        });
        return this.list(companyId, jobId);
    }
    async ensureDefaults(jobId) {
        const n = await this.prisma.jobRound.count({ where: { jobId } });
        if (n === 0) {
            await this.replaceInternal(jobId, DEFAULT_ROUNDS);
        }
    }
    async replaceInternal(jobId, rounds) {
        await this.prisma.jobRound.createMany({
            data: rounds.map((r, orderIndex) => ({
                jobId,
                orderIndex,
                label: r.label,
                roundType: r.roundType,
                conductor: r.conductor,
                meetProvider: r.meetProvider ?? client_1.MeetProvider.LIVEKIT,
                durationMinutes: r.durationMinutes ?? 45,
            })),
        });
    }
    async assertJob(companyId, jobId) {
        const job = await this.prisma.job.findFirst({ where: { id: jobId, companyId, deletedAt: null } });
        if (!job)
            throw new common_1.NotFoundException('Job not found');
        return job;
    }
};
exports.RoundsService = RoundsService;
exports.RoundsService = RoundsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        plan_features_service_1.PlanFeaturesService])
], RoundsService);
//# sourceMappingURL=rounds.service.js.map
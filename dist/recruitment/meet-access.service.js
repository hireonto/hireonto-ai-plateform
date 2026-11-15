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
exports.MeetAccessService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MeetAccessService = class MeetAccessService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getByToken(accessToken) {
        const schedule = await this.prisma.interviewSchedule.findUnique({
            where: { accessToken },
            include: {
                candidateJob: {
                    include: {
                        candidate: true,
                        job: { include: { company: true, rounds: { orderBy: { orderIndex: 'asc' } } } },
                    },
                },
            },
        });
        if (!schedule?.candidateJob)
            throw new common_1.NotFoundException('Meeting not found');
        const round = schedule.jobRoundId
            ? schedule.candidateJob.job.rounds.find((r) => r.id === schedule.jobRoundId)
            : null;
        return {
            scheduledAt: schedule.scheduledAt,
            meetUrl: schedule.meetUrl,
            meetProvider: schedule.meetProvider,
            jobTitle: schedule.candidateJob.job.title,
            roundLabel: round?.label ?? 'Interview',
            company: {
                name: schedule.candidateJob.job.company.name,
                logoUrl: schedule.candidateJob.job.company.logoUrl,
                primaryColor: schedule.candidateJob.job.company.primaryColor,
                secondaryColor: schedule.candidateJob.job.company.secondaryColor,
            },
        };
    }
};
exports.MeetAccessService = MeetAccessService;
exports.MeetAccessService = MeetAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MeetAccessService);
//# sourceMappingURL=meet-access.service.js.map
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
exports.DecisionInviteService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const decisions_service_1 = require("./decisions.service");
let DecisionInviteService = class DecisionInviteService {
    constructor(prisma, decisions, config) {
        this.prisma = prisma;
        this.decisions = decisions;
        this.config = config;
    }
    async createInvite(companyId, candidateJobId, createdById, ttlHours = 168) {
        const cj = await this.prisma.candidateJob.findFirst({
            where: { id: candidateJobId, companyId },
            include: { candidate: true, job: true },
        });
        if (!cj)
            throw new common_1.NotFoundException('Candidate not found');
        const invite = await this.prisma.decisionReviewInvite.create({
            data: {
                companyId,
                candidateJobId,
                createdById,
                expiresAt: new Date(Date.now() + ttlHours * 3600_000),
            },
        });
        const appUrl = this.config.get('appUrl') ?? 'http://localhost:3000';
        return {
            inviteUrl: `${appUrl}/recruit/decide/${invite.token}`,
            expiresAt: invite.expiresAt,
        };
    }
    async getInviteView(token) {
        const invite = await this.prisma.decisionReviewInvite.findUnique({
            where: { token },
            include: {
                candidateJob: {
                    include: {
                        candidate: true,
                        job: { include: { rounds: { orderBy: { orderIndex: 'asc' } } } },
                    },
                },
            },
        });
        if (!invite || invite.expiresAt < new Date()) {
            throw new common_1.NotFoundException('Invite expired or not found');
        }
        if (invite.usedAt)
            throw new common_1.BadRequestException('This invite was already used');
        const c = invite.candidateJob.candidate;
        return {
            candidate: {
                name: [c.firstName, c.lastName].filter(Boolean).join(' '),
                email: c.email,
            },
            job: { title: invite.candidateJob.job.title, rounds: invite.candidateJob.job.rounds },
            status: invite.candidateJob.status,
            fitScore: invite.candidateJob.fitScore,
            expiresAt: invite.expiresAt,
        };
    }
    async submitViaInvite(token, outcome, reason, reviewerName) {
        const invite = await this.prisma.decisionReviewInvite.findUnique({ where: { token } });
        if (!invite || invite.expiresAt < new Date())
            throw new common_1.NotFoundException('Invite expired or not found');
        if (invite.usedAt)
            throw new common_1.BadRequestException('Invite already used');
        const result = await this.decisions.submit(invite.companyId, invite.candidateJobId, invite.createdById ?? 'guest-reviewer', outcome, reason ? `${reason}${reviewerName ? ` (via ${reviewerName})` : ''}` : reviewerName ? `Reviewed by ${reviewerName}` : undefined);
        await this.prisma.decisionReviewInvite.update({
            where: { id: invite.id },
            data: { usedAt: new Date() },
        });
        return result;
    }
};
exports.DecisionInviteService = DecisionInviteService;
exports.DecisionInviteService = DecisionInviteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        decisions_service_1.DecisionsService,
        config_1.ConfigService])
], DecisionInviteService);
//# sourceMappingURL=decision-invite.service.js.map
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
exports.DecisionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../notifications/email.service");
let DecisionsService = class DecisionsService {
    constructor(prisma, email, config) {
        this.prisma = prisma;
        this.email = email;
        this.config = config;
    }
    async submit(companyId, candidateJobId, decidedById, outcome, reason) {
        const cj = await this.prisma.candidateJob.findFirst({
            where: { id: candidateJobId, companyId },
            include: { candidate: true, job: { include: { rounds: { orderBy: { orderIndex: 'asc' } } } } },
        });
        if (!cj)
            throw new common_1.NotFoundException('Candidate not found for this job');
        const decision = await this.prisma.recruitmentDecision.create({
            data: {
                companyId,
                candidateJobId,
                jobId: cj.jobId,
                outcome,
                reason,
                decidedById,
            },
        });
        const status = outcome === client_1.RecruitmentDecisionOutcome.SELECT
            ? client_1.CandidateJobStatus.HIRED
            : outcome === client_1.RecruitmentDecisionOutcome.REJECT
                ? client_1.CandidateJobStatus.REJECTED
                : client_1.CandidateJobStatus.ON_HOLD;
        await this.prisma.candidateJob.update({
            where: { id: candidateJobId },
            data: { status },
        });
        const appUrl = this.config.get('appUrl') ?? 'http://localhost:3000';
        const decisionUrl = `${appUrl}/decision/${decision.publicToken}`;
        const to = cj.candidate.email;
        if (to) {
            const roundLines = outcome === client_1.RecruitmentDecisionOutcome.SELECT
                ? cj.job.rounds
                    .map((r, i) => `<li>Round ${i + 1}: ${r.label} (${r.conductor === 'AI' ? 'AI' : 'Human interviewer'})</li>`)
                    .join('')
                : '';
            let body = '';
            if (outcome === client_1.RecruitmentDecisionOutcome.SELECT) {
                body = `<p>Congratulations! You have been selected to move forward for <b>${cj.job.title}</b>.</p>
${roundLines ? `<p>Next steps:</p><ul>${roundLines}</ul>` : '<p>The team will contact you about the next round.</p>'}`;
            }
            else if (outcome === client_1.RecruitmentDecisionOutcome.REJECT) {
                body = `<p>Thank you for interviewing for <b>${cj.job.title}</b>. We will not be moving forward at this time.</p>
${reason ? `<p>Note: ${reason}</p>` : ''}`;
            }
            else {
                body = `<p>Your application for <b>${cj.job.title}</b> is on hold while we complete the process.</p>
${reason ? `<p>${reason}</p>` : ''}`;
            }
            body += `<p><a href="${decisionUrl}">View details</a></p>`;
            await this.email.send({
                companyId,
                to,
                subject: outcome === client_1.RecruitmentDecisionOutcome.SELECT
                    ? `Selected — ${cj.job.title}`
                    : outcome === client_1.RecruitmentDecisionOutcome.REJECT
                        ? `Update on your application — ${cj.job.title}`
                        : `Application on hold — ${cj.job.title}`,
                template: 'recruitment_decision',
                html: body,
                metadata: { decisionId: decision.id, outcome },
            });
            await this.prisma.recruitmentDecision.update({
                where: { id: decision.id },
                data: { candidateNotifiedAt: new Date() },
            });
        }
        return { decision, decisionUrl };
    }
    async getByToken(token) {
        const d = await this.prisma.recruitmentDecision.findUnique({
            where: { publicToken: token },
            include: {
                candidateJob: {
                    include: {
                        candidate: true,
                        job: { include: { rounds: { orderBy: { orderIndex: 'asc' } } } },
                    },
                },
            },
        });
        if (!d)
            throw new common_1.NotFoundException('Decision not found');
        return {
            outcome: d.outcome,
            reason: d.reason,
            decidedAt: d.createdAt,
            candidate: {
                name: [d.candidateJob.candidate.firstName, d.candidateJob.candidate.lastName].filter(Boolean).join(' '),
                email: d.candidateJob.candidate.email,
            },
            job: { title: d.candidateJob.job.title, rounds: d.candidateJob.job.rounds },
        };
    }
};
exports.DecisionsService = DecisionsService;
exports.DecisionsService = DecisionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        config_1.ConfigService])
], DecisionsService);
//# sourceMappingURL=decisions.service.js.map
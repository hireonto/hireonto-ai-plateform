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
exports.SourcingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const ai_client_service_1 = require("../ai-client/ai-client.service");
const candidates_service_1 = require("../candidates/candidates.service");
const prisma_service_1 = require("../prisma/prisma.service");
const ats_util_1 = require("./ats.util");
const plan_features_service_1 = require("./plan-features.service");
let SourcingService = class SourcingService {
    constructor(prisma, planFeatures, candidates, ai) {
        this.prisma = prisma;
        this.planFeatures = planFeatures;
        this.candidates = candidates;
        this.ai = ai;
    }
    async getConfig(companyId, jobId) {
        await this.assertJob(companyId, jobId);
        return this.prisma.sourcingAgentConfig.upsert({
            where: { jobId },
            create: { jobId },
            update: {},
        });
    }
    async upsertConfig(companyId, jobId, data) {
        await this.planFeatures.require(companyId, 'sourcing_agent');
        await this.assertJob(companyId, jobId);
        return this.prisma.sourcingAgentConfig.upsert({
            where: { jobId },
            create: { jobId, ...data },
            update: data,
        });
    }
    async runAgent(companyId, jobId, payloads) {
        await this.planFeatures.require(companyId, 'sourcing_agent');
        const cfg = await this.getConfig(companyId, jobId);
        if (!cfg.enabled)
            throw new common_1.BadRequestException('Sourcing agent is disabled for this job');
        const job = await this.assertJob(companyId, jobId);
        const items = payloads.length ? payloads : this.demoExternalResumes(job.title, cfg.searchKeywords ?? job.title);
        let ingested = 0;
        let skippedDup = 0;
        let skippedAts = 0;
        let nonAtsUsed = 0;
        const nonAtsBudget = Math.ceil((items.length || 1) * (cfg.nonAtsMaxPercent / 100));
        for (const p of items) {
            if (!cfg.sources.includes(p.source) && p.source !== client_1.SourcingSource.MANUAL)
                continue;
            const hash = (0, ats_util_1.contentHash)(p.resumeText);
            const existing = await this.prisma.resumeIngestFingerprint.findUnique({
                where: { jobId_contentHash: { jobId, contentHash: hash } },
            });
            if (existing) {
                skippedDup++;
                continue;
            }
            const { score, atsFriendly } = (0, ats_util_1.scoreAtsResume)(p.resumeText);
            if (score < cfg.atsMinScore) {
                if (!atsFriendly && nonAtsUsed < nonAtsBudget) {
                    nonAtsUsed++;
                }
                else {
                    skippedAts++;
                    await this.prisma.resumeIngestFingerprint.create({
                        data: {
                            jobId,
                            source: p.source,
                            externalId: p.externalId,
                            contentHash: hash,
                            atsScore: score,
                        },
                    });
                    continue;
                }
            }
            const candidate = await this.candidates.createFromTextResume(companyId, {
                jobId,
                fileName: p.fileName,
                resumeText: p.resumeText,
                firstName: p.firstName,
                lastName: p.lastName,
                email: p.email,
                phone: p.phone,
            });
            const jobRecord = await this.prisma.job.findUnique({ where: { id: jobId } });
            const fit = await this.ai.scoreFit({
                companyId,
                candidateJobId: '',
                jobDescription: jobRecord?.description ?? jobRecord?.title ?? '',
                resumeText: p.resumeText,
            });
            const cj = await this.prisma.candidateJob.findUnique({
                where: { candidateId_jobId: { candidateId: candidate.candidateId, jobId } },
            });
            if (cj) {
                await this.prisma.candidateJob.update({
                    where: { id: cj.id },
                    data: { fitScore: fit.score, fitExplanation: fit.explanation },
                });
            }
            await this.prisma.resumeIngestFingerprint.create({
                data: {
                    jobId,
                    source: p.source,
                    externalId: p.externalId,
                    contentHash: hash,
                    candidateId: candidate.candidateId,
                    resumeId: candidate.resumeId,
                    atsScore: score,
                },
            });
            ingested++;
        }
        const summary = { ingested, skippedDup, skippedAts, nonAtsUsed, attempted: items.length, demo: !payloads.length };
        await this.prisma.sourcingAgentConfig.update({
            where: { jobId },
            data: { lastRunAt: new Date(), lastRunSummary: summary },
        });
        return summary;
    }
    async ingestOne(companyId, jobId, dto) {
        return this.runAgent(companyId, jobId, [dto]);
    }
    demoExternalResumes(jobTitle, keywords) {
        const k = keywords || jobTitle;
        return [
            {
                source: client_1.SourcingSource.NAUKRI,
                externalId: `naukri-demo-${Date.now()}-1`,
                fileName: 'priya-naukri.txt',
                firstName: 'Priya',
                lastName: 'Verma',
                email: `priya.demo.${Date.now()}@example.com`,
                phone: '+919876543210',
                resumeText: `Priya Verma — ${k}\nSkills: TypeScript, Node.js, PostgreSQL, React, AWS\nExperience: 5 years backend engineer\nEducation: B.Tech CS\nATS keywords: ${k}, microservices, REST API`,
            },
            {
                source: client_1.SourcingSource.LINKEDIN,
                externalId: `linkedin-demo-${Date.now()}-2`,
                fileName: 'arjun-linkedin.txt',
                firstName: 'Arjun',
                lastName: 'Mehta',
                email: `arjun.demo.${Date.now()}@example.com`,
                resumeText: `Arjun Mehta\n${k} specialist | Java | Spring | Kafka\n3 yrs product company\nSummary aligned to ${jobTitle}`,
            },
        ];
    }
    async assertJob(companyId, jobId) {
        const job = await this.prisma.job.findFirst({ where: { id: jobId, companyId, deletedAt: null } });
        if (!job)
            throw new common_1.NotFoundException('Job not found');
        return job;
    }
};
exports.SourcingService = SourcingService;
exports.SourcingService = SourcingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        plan_features_service_1.PlanFeaturesService,
        candidates_service_1.CandidatesService,
        ai_client_service_1.AiClientService])
], SourcingService);
//# sourceMappingURL=sourcing.service.js.map
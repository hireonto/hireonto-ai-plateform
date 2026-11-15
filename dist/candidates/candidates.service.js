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
exports.CandidatesService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const client_1 = require("@prisma/client");
const bullmq_2 = require("bullmq");
const client_2 = require("@prisma/client");
const audit_service_1 = require("../common/audit/audit.service");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const jobs_service_1 = require("../jobs/jobs.service");
const candidates_constants_1 = require("./candidates.constants");
let CandidatesService = class CandidatesService {
    constructor(prisma, storage, jobs, audit, parseQueue) {
        this.prisma = prisma;
        this.storage = storage;
        this.jobs = jobs;
        this.audit = audit;
        this.parseQueue = parseQueue;
    }
    async getProfileAudited(companyId, candidateId, actorId) {
        const profile = await this.getProfile(companyId, candidateId);
        await this.audit.log({
            companyId,
            actorId,
            action: client_2.AuditAction.VIEW,
            resourceType: 'candidate',
            resourceId: candidateId,
        });
        return profile;
    }
    listForJob(companyId, jobId) {
        return this.prisma.candidateJob.findMany({
            where: { companyId, jobId, deletedAt: null },
            include: {
                candidate: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        firstName: true,
                        lastName: true,
                        tags: true,
                    },
                },
            },
            orderBy: { fitScore: 'desc' },
        });
    }
    async getProfile(companyId, candidateId) {
        const candidate = await this.prisma.candidate.findFirst({
            where: { id: candidateId, companyId, deletedAt: null },
            include: {
                resumes: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
                candidateJobs: {
                    where: { deletedAt: null },
                    include: { job: { select: { id: true, title: true } } },
                },
            },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        return candidate;
    }
    async bulkPresign(companyId, jobId, files) {
        await this.jobs.get(companyId, jobId);
        const uploads = [];
        for (const file of files) {
            const dedupeEmail = file.email?.toLowerCase();
            let candidate = await this.findExistingCandidate(companyId, dedupeEmail, file.phone);
            if (!candidate) {
                candidate = await this.prisma.candidate.create({
                    data: {
                        companyId,
                        email: dedupeEmail,
                        phone: file.phone,
                        firstName: file.firstName,
                        lastName: file.lastName,
                    },
                });
            }
            await this.prisma.candidateJob.upsert({
                where: {
                    candidateId_jobId: { candidateId: candidate.id, jobId },
                },
                create: {
                    companyId,
                    candidateId: candidate.id,
                    jobId,
                    status: client_1.CandidateJobStatus.PARSING,
                },
                update: { status: client_1.CandidateJobStatus.PARSING },
            });
            const key = this.storage.resumeKey(companyId, file.fileName);
            const presigned = await this.storage.presignedPut(key, file.contentType);
            const resume = await this.prisma.resume.create({
                data: {
                    companyId,
                    candidateId: candidate.id,
                    storageKey: key,
                    fileName: file.fileName,
                    mimeType: file.contentType,
                    parseStatus: 'queued',
                },
            });
            uploads.push({
                candidateId: candidate.id,
                resumeId: resume.id,
                ...presigned,
            });
        }
        return { uploads };
    }
    async confirmBulkUpload(companyId, jobId, resumeIds) {
        await this.jobs.get(companyId, jobId);
        const enqueued = [];
        for (const resumeId of resumeIds) {
            const resume = await this.prisma.resume.findFirst({
                where: { id: resumeId, companyId, deletedAt: null },
            });
            if (!resume) {
                continue;
            }
            const data = {
                companyId,
                jobId,
                candidateId: resume.candidateId,
                resumeId: resume.id,
                storageKey: resume.storageKey,
            };
            await this.parseQueue.add('parse', data, {
                removeOnComplete: 100,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            });
            enqueued.push(resumeId);
        }
        return { enqueued };
    }
    async createFromTextResume(companyId, input) {
        await this.jobs.get(companyId, input.jobId);
        const dedupeEmail = input.email?.toLowerCase();
        let candidate = await this.findExistingCandidate(companyId, dedupeEmail, input.phone);
        if (!candidate) {
            candidate = await this.prisma.candidate.create({
                data: {
                    companyId,
                    email: dedupeEmail,
                    phone: input.phone,
                    firstName: input.firstName,
                    lastName: input.lastName,
                },
            });
        }
        await this.prisma.candidateJob.upsert({
            where: { candidateId_jobId: { candidateId: candidate.id, jobId: input.jobId } },
            create: {
                companyId,
                candidateId: candidate.id,
                jobId: input.jobId,
                status: client_1.CandidateJobStatus.PARSED,
            },
            update: { status: client_1.CandidateJobStatus.PARSED },
        });
        const key = this.storage.resumeKey(companyId, `sourcing-${Date.now()}-${input.fileName}`);
        const resume = await this.prisma.resume.create({
            data: {
                companyId,
                candidateId: candidate.id,
                storageKey: key,
                fileName: input.fileName,
                mimeType: 'text/plain',
                parseStatus: 'parsed',
                parsedText: input.resumeText,
            },
        });
        return { candidateId: candidate.id, resumeId: resume.id };
    }
    async updateTags(companyId, candidateId, tags) {
        await this.getProfile(companyId, candidateId);
        return this.prisma.candidate.update({
            where: { id: candidateId },
            data: { tags },
        });
    }
    async updateNotes(companyId, candidateId, notes) {
        await this.getProfile(companyId, candidateId);
        return this.prisma.candidate.update({
            where: { id: candidateId },
            data: { notes },
        });
    }
    findExistingCandidate(companyId, email, phone) {
        if (!email && !phone) {
            return null;
        }
        return this.prisma.candidate.findFirst({
            where: {
                companyId,
                deletedAt: null,
                OR: [
                    ...(email ? [{ email }] : []),
                    ...(phone ? [{ phone }] : []),
                ],
            },
        });
    }
};
exports.CandidatesService = CandidatesService;
exports.CandidatesService = CandidatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bullmq_1.InjectQueue)(candidates_constants_1.RESUME_PARSE_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        jobs_service_1.JobsService,
        audit_service_1.AuditService,
        bullmq_2.Queue])
], CandidatesService);
//# sourceMappingURL=candidates.service.js.map
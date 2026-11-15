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
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
let JobsService = class JobsService {
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    list(companyId) {
        return this.prisma.job.findMany({
            where: { companyId, deletedAt: null },
            include: { interviewConfig: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async get(companyId, jobId) {
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, companyId, deletedAt: null },
            include: {
                interviewConfig: true,
                questionBanks: { where: { deletedAt: null } },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        return job;
    }
    create(companyId, dto, createdById) {
        return this.prisma.job.create({
            data: {
                companyId,
                title: dto.title,
                description: dto.description,
                location: dto.location,
                autoShortlistThreshold: dto.autoShortlistThreshold,
                createdById,
                interviewConfig: {
                    create: {},
                },
            },
            include: { interviewConfig: true },
        });
    }
    async update(companyId, jobId, dto) {
        await this.get(companyId, jobId);
        return this.prisma.job.update({
            where: { id: jobId },
            data: dto,
            include: { interviewConfig: true },
        });
    }
    async upsertInterviewConfig(companyId, jobId, dto) {
        await this.get(companyId, jobId);
        return this.prisma.jobInterviewConfig.upsert({
            where: { jobId },
            create: { jobId, ...dto },
            update: dto,
        });
    }
    async presignJd(companyId, jobId, fileName, contentType) {
        await this.get(companyId, jobId);
        const key = this.storage.jdKey(companyId, jobId, fileName);
        const presigned = await this.storage.presignedPut(key, contentType);
        await this.prisma.job.update({
            where: { id: jobId },
            data: { jdStorageKey: key },
        });
        return presigned;
    }
    async presignQuestionBank(companyId, jobId, fileName, contentType) {
        await this.get(companyId, jobId);
        const key = this.storage.questionBankKey(companyId, jobId, fileName);
        const presigned = await this.storage.presignedPut(key, contentType);
        const doc = await this.prisma.questionBankDoc.create({
            data: { jobId, fileName, storageKey: key },
        });
        return { ...presigned, documentId: doc.id };
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map
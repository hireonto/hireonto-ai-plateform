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
var CandidatesProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidatesProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const ai_client_service_1 = require("../ai-client/ai-client.service");
const prisma_service_1 = require("../prisma/prisma.service");
const candidates_constants_1 = require("./candidates.constants");
let CandidatesProcessor = CandidatesProcessor_1 = class CandidatesProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, ai) {
        super();
        this.prisma = prisma;
        this.ai = ai;
        this.logger = new common_1.Logger(CandidatesProcessor_1.name);
    }
    async process(job) {
        const { companyId, jobId, candidateId, resumeId, storageKey } = job.data;
        this.logger.log(`Parsing resume ${resumeId}`);
        const parsed = await this.ai.parseResume({
            companyId,
            resumeId,
            storageKey,
            jobId,
        });
        await this.prisma.resume.update({
            where: { id: resumeId },
            data: {
                parseStatus: 'parsed',
                parsedText: parsed.text,
            },
        });
        const jobRecord = await this.prisma.job.findUnique({ where: { id: jobId } });
        const fit = await this.ai.scoreFit({
            companyId,
            candidateJobId: '',
            jobDescription: jobRecord?.description ?? jobRecord?.title ?? '',
            resumeText: parsed.text,
        });
        const candidateJob = await this.prisma.candidateJob.findUnique({
            where: { candidateId_jobId: { candidateId, jobId } },
        });
        if (candidateJob) {
            await this.prisma.candidateJob.update({
                where: { id: candidateJob.id },
                data: {
                    status: client_1.CandidateJobStatus.PARSED,
                    fitScore: fit.score,
                    fitExplanation: fit.explanation,
                },
            });
        }
        return { resumeId, fitScore: fit.score };
    }
};
exports.CandidatesProcessor = CandidatesProcessor;
exports.CandidatesProcessor = CandidatesProcessor = CandidatesProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(candidates_constants_1.RESUME_PARSE_QUEUE),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_client_service_1.AiClientService])
], CandidatesProcessor);
//# sourceMappingURL=candidates.processor.js.map
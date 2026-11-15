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
var CodingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let CodingService = CodingService_1 = class CodingService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.logger = new common_1.Logger(CodingService_1.name);
    }
    async runSample(params) {
        return this.submitToJudge0(params, false);
    }
    async submitHidden(params) {
        return this.submitToJudge0(params, true);
    }
    async submitToJudge0(params, isHiddenTest) {
        const submission = await this.prisma.codeSubmission.create({
            data: {
                answerId: params.answerId,
                languageId: params.languageId,
                sourceCode: params.sourceCode,
                stdin: params.stdin,
                status: client_1.CodeSubmissionStatus.PENDING,
                isHiddenTest,
            },
        });
        const fakeMode = this.config.get('ai.fakeMode');
        if (fakeMode) {
            const updated = await this.prisma.codeSubmission.update({
                where: { id: submission.id },
                data: {
                    status: client_1.CodeSubmissionStatus.ACCEPTED,
                    stdout: 'OK\n',
                    passedTests: isHiddenTest ? 5 : 2,
                    totalTests: isHiddenTest ? 5 : 2,
                },
            });
            return updated;
        }
        const judge0Url = this.config.get('judge0.url') ?? 'http://localhost:2358';
        try {
            const res = await fetch(`${judge0Url}/submissions?base64_encoded=false`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_code: params.sourceCode,
                    language_id: params.languageId,
                    stdin: params.stdin ?? '',
                }),
            });
            const data = (await res.json());
            const token = data.token;
            let result = {};
            if (token) {
                await new Promise((r) => setTimeout(r, 1500));
                const poll = await fetch(`${judge0Url}/submissions/${token}`);
                result = (await poll.json());
            }
            const statusDesc = typeof result.status === 'object' &&
                result.status &&
                'description' in result.status
                ? String(result.status.description ?? '')
                : '';
            const status = mapJudgeStatus(statusDesc);
            return this.prisma.codeSubmission.update({
                where: { id: submission.id },
                data: {
                    judge0Token: token,
                    status,
                    stdout: String(result.stdout ?? ''),
                    stderr: String(result.stderr ?? ''),
                },
            });
        }
        catch (err) {
            this.logger.warn(`Judge0 error: ${err}`);
            return this.prisma.codeSubmission.update({
                where: { id: submission.id },
                data: { status: client_1.CodeSubmissionStatus.RUNTIME_ERROR },
            });
        }
    }
};
exports.CodingService = CodingService;
exports.CodingService = CodingService = CodingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], CodingService);
function mapJudgeStatus(desc) {
    if (desc.includes('Accepted')) {
        return client_1.CodeSubmissionStatus.ACCEPTED;
    }
    if (desc.includes('Wrong')) {
        return client_1.CodeSubmissionStatus.WRONG_ANSWER;
    }
    if (desc.includes('Time')) {
        return client_1.CodeSubmissionStatus.TIME_LIMIT;
    }
    if (desc.includes('Compilation')) {
        return client_1.CodeSubmissionStatus.COMPILE_ERROR;
    }
    return client_1.CodeSubmissionStatus.RUNTIME_ERROR;
}
//# sourceMappingURL=coding.service.js.map
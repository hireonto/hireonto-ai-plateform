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
var ConversationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const livekit_server_sdk_1 = require("livekit-server-sdk");
const ai_client_service_1 = require("../ai-client/ai-client.service");
const interview_context_service_1 = require("../ai-client/interview-context.service");
const evaluation_service_1 = require("../evaluation/evaluation.service");
const prisma_service_1 = require("../prisma/prisma.service");
const proctoring_service_1 = require("../proctoring/proctoring.service");
const recruiter_gateway_1 = require("../realtime/recruiter.gateway");
const round_advance_service_1 = require("../recruitment/round-advance.service");
const ACTIVE = [
    client_1.InterviewStatus.PENDING,
    client_1.InterviewStatus.INVITED,
    client_1.InterviewStatus.IN_PROGRESS,
];
const JOB_ACTIVE = new Set([0, 1]);
let ConversationService = ConversationService_1 = class ConversationService {
    constructor(prisma, config, ai, interviewContext, evaluation, recruiter, proctoring, roundAdvance) {
        this.prisma = prisma;
        this.config = config;
        this.ai = ai;
        this.interviewContext = interviewContext;
        this.evaluation = evaluation;
        this.recruiter = recruiter;
        this.proctoring = proctoring;
        this.roundAdvance = roundAdvance;
        this.logger = new common_1.Logger(ConversationService_1.name);
        this.opening = new Map();
        this.planning = new Map();
        this.dispatching = new Map();
    }
    get voiceEnabled() {
        return Boolean(this.config.get('livekit.url') &&
            this.config.get('livekit.apiKey') &&
            this.config.get('livekit.apiSecret'));
    }
    async start(interviewId, candidateId) {
        const interview = await this.getCandidateInterview(interviewId, candidateId);
        if (!ACTIVE.includes(interview.status)) {
            throw new common_1.BadRequestException('Interview not active');
        }
        if (interview.windowEnd < new Date()) {
            throw new common_1.BadRequestException('Interview window expired');
        }
        await this.prisma.interview.update({
            where: { id: interviewId },
            data: {
                status: client_1.InterviewStatus.IN_PROGRESS,
                startedAt: interview.startedAt ?? new Date(),
            },
        });
        await this.prisma.candidateJob.updateMany({
            where: { candidateId, jobId: interview.jobId },
            data: { status: 'INTERVIEW_IN_PROGRESS' },
        });
        await this.ensurePlan(interviewId, interview.companyId);
        if (await this.useVoice()) {
            return this.voiceToken(interviewId, candidateId);
        }
        return { mode: 'chat', history: await this.openingTurn(interviewId, interview.companyId), done: false };
    }
    async ensureVoiceAgent(interviewId, candidateId) {
        const interview = await this.getCandidateInterview(interviewId, candidateId);
        if (interview.status !== client_1.InterviewStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Interview not in progress');
        }
        if (!(await this.useVoice())) {
            throw new common_1.BadRequestException('Voice mode is not enabled');
        }
        const roomName = `interview-${interviewId}`;
        const agentName = this.config.get('livekit.agentName') ?? 'hiremind-interviewer';
        await this.dispatchVoiceAgent(roomName, agentName, interviewId);
        this.logger.log(`Dispatched voice agent for interview ${interviewId}`);
        return { dispatched: true, roomName };
    }
    async useVoice() {
        const mode = this.config.get('interviewMode') ?? 'auto';
        if (mode === 'chat')
            return false;
        if (!this.voiceEnabled)
            return false;
        return mode === 'voice' || this.ai.voiceReady();
    }
    ensurePlan(interviewId, companyId) {
        const pending = this.planning.get(interviewId);
        if (pending)
            return pending;
        const run = (async () => {
            if ((await this.interviewContext.plan(interviewId)).length)
                return;
            try {
                await this.ai.planInterview(companyId, interviewId, await this.context(interviewId));
            }
            catch (err) {
                this.logger.warn(`Question plan failed for ${interviewId}: ${err}`);
            }
        })().finally(() => this.planning.delete(interviewId));
        this.planning.set(interviewId, run);
        return run;
    }
    openingTurn(interviewId, companyId) {
        const pending = this.opening.get(interviewId);
        if (pending)
            return pending;
        const run = (async () => {
            const history = await this.history(interviewId);
            if (history.length)
                return history;
            const first = await this.ai.chatTurn(companyId, await this.context(interviewId), []);
            await this.addTurn(interviewId, 'interviewer', first.reply);
            return this.history(interviewId);
        })().finally(() => this.opening.delete(interviewId));
        this.opening.set(interviewId, run);
        return run;
    }
    async chat(interviewId, candidateId, message) {
        const interview = await this.getCandidateInterview(interviewId, candidateId);
        if (interview.status !== client_1.InterviewStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Interview not in progress');
        }
        if (interview.windowEnd < new Date()) {
            throw new common_1.BadRequestException('Interview window expired');
        }
        const text = message.trim();
        if (!text) {
            throw new common_1.BadRequestException('Message is empty');
        }
        await this.addTurn(interviewId, 'candidate', text);
        const turn = await this.ai.chatTurn(interview.companyId, await this.context(interviewId), await this.history(interviewId));
        await this.addTurn(interviewId, 'interviewer', turn.reply);
        if (turn.done) {
            await this.complete(interviewId, 'completed');
        }
        return { reply: turn.reply, done: turn.done };
    }
    context(interviewId) {
        return this.interviewContext.context(interviewId);
    }
    history(interviewId) {
        return this.interviewContext.transcript(interviewId);
    }
    async planForStaff(companyId, interviewId) {
        await this.assertCompanyInterview(companyId, interviewId);
        return this.interviewContext.plan(interviewId);
    }
    agentProctoringEvent(interviewId, eventType, severity, detail) {
        return this.proctoring.ingestBatch(interviewId, [
            { eventType, severity, payload: { detail, source: 'ai_interviewer' }, clientTimestamp: new Date().toISOString() },
        ]);
    }
    async assertCompanyInterview(companyId, interviewId) {
        const interview = await this.prisma.interview.findFirst({
            where: { id: interviewId, companyId, deletedAt: null },
            select: { id: true },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
    }
    async transcriptForStaff(companyId, interviewId) {
        await this.assertCompanyInterview(companyId, interviewId);
        return this.history(interviewId);
    }
    async addTurn(interviewId, role, text) {
        const last = await this.prisma.interviewQuestion.findFirst({
            where: { interviewId },
            orderBy: { orderIndex: 'desc' },
            include: { answers: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        if (role === 'interviewer') {
            if (last && !last.answers.length) {
                await this.prisma.interviewQuestion.update({
                    where: { id: last.id },
                    data: { questionText: `${last.questionText} ${text}` },
                });
            }
            else {
                await this.prisma.interviewQuestion.create({
                    data: {
                        interviewId,
                        orderIndex: (last?.orderIndex ?? -1) + 1,
                        questionText: text,
                        questionType: 'conversation',
                        isFollowUp: false,
                    },
                });
            }
        }
        else if (last) {
            const existing = last.answers[0];
            if (existing) {
                await this.prisma.answer.update({
                    where: { id: existing.id },
                    data: { transcript: `${existing.transcript ?? ''} ${text}`.trim() },
                });
            }
            else {
                await this.prisma.answer.create({
                    data: {
                        interviewQuestionId: last.id,
                        transcript: text,
                        submittedAt: new Date(),
                    },
                });
            }
        }
        this.recruiter.emitLiveTranscript(interviewId, {
            text: `${role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${text}`,
            answerId: last?.id ?? '',
        });
    }
    async complete(interviewId, reason) {
        const interview = await this.prisma.interview.findFirst({
            where: { id: interviewId, deletedAt: null },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        if (interview.status !== client_1.InterviewStatus.IN_PROGRESS) {
            return { completed: false, status: interview.status };
        }
        await this.prisma.interview.update({
            where: { id: interviewId },
            data: { status: client_1.InterviewStatus.COMPLETED, finishedAt: new Date() },
        });
        await this.prisma.candidateJob.updateMany({
            where: { candidateId: interview.candidateId, jobId: interview.jobId },
            data: { status: 'INTERVIEW_COMPLETED' },
        });
        await this.roundAdvance.afterInterviewCompleted(interviewId).catch(() => undefined);
        this.logger.log(`Interview ${interviewId} completed (${reason})`);
        void this.evaluation
            .trigger(interviewId, interview.companyId)
            .catch((err) => this.logger.warn(`Auto-evaluation failed: ${err}`));
        return { completed: true };
    }
    async voiceToken(interviewId, candidateId) {
        const roomName = `interview-${interviewId}`;
        const at = new livekit_server_sdk_1.AccessToken(this.config.get('livekit.apiKey'), this.config.get('livekit.apiSecret'), { identity: `candidate-${candidateId}`, ttl: '2h' });
        at.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });
        const agentName = this.config.get('livekit.agentName') ?? 'hiremind-interviewer';
        await this.ensureRoom(roomName);
        await this.dispatchVoiceAgent(roomName, agentName, interviewId);
        return {
            mode: 'voice',
            url: this.config.get('livekit.url'),
            token: await at.toJwt(),
            roomName,
        };
    }
    livekitHttpUrl() {
        const url = this.config.get('livekit.url');
        return url.replace(/^ws(s?):/i, 'http$1:');
    }
    async ensureRoom(roomName) {
        const rooms = new livekit_server_sdk_1.RoomServiceClient(this.livekitHttpUrl(), this.config.get('livekit.apiKey'), this.config.get('livekit.apiSecret'));
        try {
            await rooms.createRoom({ name: roomName, departureTimeout: 120, emptyTimeout: 300 });
        }
        catch (err) {
            this.logger.warn(`LiveKit room create failed for ${roomName}: ${err}`);
        }
    }
    dispatchVoiceAgent(roomName, agentName, interviewId) {
        const inflight = this.dispatching.get(roomName);
        if (inflight)
            return inflight;
        const run = this.dispatchOnce(roomName, agentName, interviewId).finally(() => this.dispatching.delete(roomName));
        this.dispatching.set(roomName, run);
        return run;
    }
    async dispatchOnce(roomName, agentName, interviewId) {
        const client = new livekit_server_sdk_1.AgentDispatchClient(this.livekitHttpUrl(), this.config.get('livekit.apiKey'), this.config.get('livekit.apiSecret'));
        try {
            const existing = await client.listDispatch(roomName);
            const active = existing.some((d) => d.agentName === agentName &&
                !d.state?.deletedAt &&
                (!d.state?.jobs.length || d.state.jobs.some((j) => JOB_ACTIVE.has(j.state?.status ?? -1))));
            if (active)
                return;
            await client.createDispatch(roomName, agentName, {
                metadata: JSON.stringify({ interviewId }),
            });
        }
        catch (err) {
            this.logger.warn(`LiveKit agent dispatch failed for ${roomName}: ${err}`);
        }
    }
    async getCandidateInterview(interviewId, candidateId) {
        const interview = await this.prisma.interview.findFirst({
            where: { id: interviewId, candidateId, deletedAt: null },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        return interview;
    }
};
exports.ConversationService = ConversationService;
exports.ConversationService = ConversationService = ConversationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        ai_client_service_1.AiClientService,
        interview_context_service_1.InterviewContextService,
        evaluation_service_1.EvaluationService,
        recruiter_gateway_1.RecruiterGateway,
        proctoring_service_1.ProctoringService,
        round_advance_service_1.RoundAdvanceService])
], ConversationService);
//# sourceMappingURL=conversation.service.js.map
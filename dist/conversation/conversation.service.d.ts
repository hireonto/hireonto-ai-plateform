import { ConfigService } from '@nestjs/config';
import { AiClientService, ConversationTurn } from '../ai-client/ai-client.service';
import { InterviewContextService } from '../ai-client/interview-context.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProctoringService } from '../proctoring/proctoring.service';
import { RecruiterGateway } from '../realtime/recruiter.gateway';
import { RoundAdvanceService } from '../recruitment/round-advance.service';
export type ConversationStart = {
    mode: 'voice';
    url: string;
    token: string;
    roomName: string;
} | {
    mode: 'chat';
    history: ConversationTurn[];
    done: boolean;
};
export declare class ConversationService {
    private readonly prisma;
    private readonly config;
    private readonly ai;
    private readonly interviewContext;
    private readonly evaluation;
    private readonly recruiter;
    private readonly proctoring;
    private readonly roundAdvance;
    private readonly logger;
    private readonly opening;
    private readonly planning;
    private readonly dispatching;
    constructor(prisma: PrismaService, config: ConfigService, ai: AiClientService, interviewContext: InterviewContextService, evaluation: EvaluationService, recruiter: RecruiterGateway, proctoring: ProctoringService, roundAdvance: RoundAdvanceService);
    get voiceEnabled(): boolean;
    start(interviewId: string, candidateId: string): Promise<ConversationStart>;
    ensureVoiceAgent(interviewId: string, candidateId: string): Promise<{
        dispatched: boolean;
        roomName: string;
    }>;
    private useVoice;
    private ensurePlan;
    private openingTurn;
    chat(interviewId: string, candidateId: string, message: string): Promise<{
        reply: string;
        done: boolean;
    }>;
    context(interviewId: string): Promise<import("../ai-client/ai-client.service").InterviewContext>;
    history(interviewId: string): Promise<ConversationTurn[]>;
    planForStaff(companyId: string, interviewId: string): Promise<import("../ai-client/ai-client.service").PlannedQuestion[]>;
    agentProctoringEvent(interviewId: string, eventType: string, severity: string, detail: string): Promise<{
        stored: number;
        strikeCount: number;
        terminated: boolean;
    }>;
    private assertCompanyInterview;
    transcriptForStaff(companyId: string, interviewId: string): Promise<ConversationTurn[]>;
    addTurn(interviewId: string, role: ConversationTurn['role'], text: string): Promise<void>;
    complete(interviewId: string, reason: string): Promise<{
        completed: boolean;
        status: "PENDING" | "INVITED" | "COMPLETED" | "EXPIRED" | "CANCELLED" | "TERMINATED";
    } | {
        completed: boolean;
        status?: undefined;
    }>;
    private voiceToken;
    private livekitHttpUrl;
    private ensureRoom;
    private dispatchVoiceAgent;
    private dispatchOnce;
    private getCandidateInterview;
}

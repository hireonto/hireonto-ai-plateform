import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export interface ParseResumeRequest {
    companyId: string;
    resumeId: string;
    storageKey: string;
    jobId?: string;
}
export interface InterviewContext {
    interview_id: string;
    candidate_name: string;
    company_name: string;
    job_title: string;
    job_description: string;
    resume_text: string;
    question_count: number;
    duration_minutes: number;
    coding_enabled: boolean;
    jd_document_key: string | null;
    question_bank_keys: string[];
    question_plan: PlannedQuestion[];
}
export interface PlannedQuestion {
    id: string;
    competency: string;
    question: string;
    rationale: string;
    follow_ups: string[];
    source: 'resume' | 'jd' | 'question_bank' | string;
    evidence: string[];
}
export interface ConversationTurn {
    role: 'interviewer' | 'candidate';
    text: string;
}
export interface InterviewEvaluation {
    overallScore: number;
    recommendation: string;
    summary: string;
    strengths: string[];
    concerns: string[];
    dimensions: Record<string, number>;
    evidence: Record<string, string>;
    authenticity: {
        human_likelihood: number;
        verdict: 'likely_human' | 'uncertain' | 'likely_ai_assisted';
        signals: string[];
        flagged_answers: string[];
    };
}
export interface FitScoreRequest {
    companyId: string;
    candidateJobId: string;
    jobDescription: string;
    resumeText: string;
}
export declare class AiClientService {
    private readonly config;
    private readonly jwt;
    private readonly prisma;
    private readonly logger;
    private failures;
    private circuitOpenUntil;
    constructor(config: ConfigService, jwt: JwtService, prisma: PrismaService);
    parseResume(req: ParseResumeRequest): Promise<{
        text: string;
    }>;
    scoreFit(req: FitScoreRequest): Promise<{
        score: number;
        explanation: string;
    }>;
    chatTurn(companyId: string, context: InterviewContext, history: ConversationTurn[]): Promise<{
        reply: string;
        done: boolean;
    }>;
    planInterview(companyId: string, interviewId: string, context: InterviewContext): Promise<{
        questions: PlannedQuestion[];
    }>;
    voiceReady(): Promise<boolean>;
    evaluateInterview(companyId: string, context: InterviewContext, transcript: ConversationTurn[], integrityEvents?: string[]): Promise<InterviewEvaluation>;
    private post;
    private internalToken;
}

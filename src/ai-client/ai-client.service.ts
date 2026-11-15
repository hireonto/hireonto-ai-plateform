import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AiRunStatus } from '@prisma/client';
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
  /** Whether answers sound like the candidate's own words or read from an AI tool. */
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

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private failures = 0;
  private circuitOpenUntil = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async parseResume(req: ParseResumeRequest): Promise<{ text: string }> {
    if (this.config.get<boolean>('ai.fakeMode')) {
      return {
        text: `FAKE PARSED RESUME for ${req.storageKey}\nSkills: Node.js, TypeScript, PostgreSQL`,
      };
    }
    return this.post('/v1/resume/parse', req, req.companyId, 'parse_resume');
  }

  async scoreFit(req: FitScoreRequest): Promise<{ score: number; explanation: string }> {
    if (this.config.get<boolean>('ai.fakeMode')) {
      const score = 0.65 + Math.random() * 0.3;
      return {
        score: Math.round(score * 100) / 100,
        explanation: 'FAKE_MODE: Strong backend alignment with job requirements.',
      };
    }
    return this.post('/v1/fit/score', req, req.companyId, 'fit_score');
  }

  /** Text-mode interview turn. Always served by hiremind-ai (which has its own fake mode). */
  chatTurn(
    companyId: string,
    context: InterviewContext,
    history: ConversationTurn[],
  ): Promise<{ reply: string; done: boolean }> {
    return this.post('/v1/interview/chat', { context, history }, companyId, 'interview_chat');
  }

  /** Builds the RAG question plan (JD + resume + question banks). Stored as an AiRun on the interview. */
  planInterview(
    companyId: string,
    interviewId: string,
    context: InterviewContext,
  ): Promise<{ questions: PlannedQuestion[] }> {
    return this.post('/v1/interview/plan', { context }, companyId, 'interview_plan', interviewId);
  }

  /** Whether the voice agent has every key it needs (LiveKit + Claude + speech). */
  async voiceReady(): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.get<string>('ai.serviceUrl')}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      const body = (await res.json()) as { voiceReady?: boolean };
      return Boolean(body.voiceReady);
    } catch {
      return false;
    }
  }

  evaluateInterview(
    companyId: string,
    context: InterviewContext,
    transcript: ConversationTurn[],
    integrityEvents: string[] = [],
  ): Promise<InterviewEvaluation> {
    return this.post(
      '/v1/interview/evaluate',
      { context, transcript, integrity_events: integrityEvents },
      companyId,
      'interview_evaluation',
    );
  }

  private async post<T>(
    path: string,
    body: unknown,
    companyId: string,
    operation: string,
    interviewId?: string,
  ): Promise<T> {
    if (Date.now() < this.circuitOpenUntil) {
      throw new Error('AI service circuit open');
    }
    const baseUrl = this.config.get<string>('ai.serviceUrl');
    const token = await this.internalToken(companyId);
    const run = await this.prisma.aiRun.create({
      data: {
        companyId,
        interviewId,
        operation,
        status: AiRunStatus.RUNNING,
        requestPayload: body as object,
      },
    });

    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(`${baseUrl}${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error(`AI ${path} failed: ${res.status}`);
        }
        const data = (await res.json()) as T;
        this.failures = 0;
        await this.prisma.aiRun.update({
          where: { id: run.id },
          data: {
            status: AiRunStatus.SUCCEEDED,
            responseSummary: data as object,
          },
        });
        return data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`AI attempt ${attempt} failed: ${lastError.message}`);
        await new Promise((r) => setTimeout(r, attempt * 200));
      }
    }

    this.failures += 1;
    if (this.failures >= 5) {
      this.circuitOpenUntil = Date.now() + 30_000;
    }
    await this.prisma.aiRun.update({
      where: { id: run.id },
      data: {
        status: AiRunStatus.FAILED,
        error: lastError?.message,
      },
    });
    throw lastError ?? new Error('AI request failed');
  }

  private internalToken(companyId: string) {
    return this.jwt.signAsync(
      { sub: 'hiremind-backend', companyId, aud: 'ai-service' },
      {
        secret: this.config.get<string>('jwt.internalSecret'),
        expiresIn: '5m',
      },
    );
  }
}

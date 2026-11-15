import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InterviewStatus } from '@prisma/client';
import {
  AccessToken,
  AgentDispatchClient,
  RoomServiceClient,
} from 'livekit-server-sdk';
import { AiClientService, ConversationTurn } from '../ai-client/ai-client.service';
import { InterviewContextService } from '../ai-client/interview-context.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProctoringService } from '../proctoring/proctoring.service';
import { RecruiterGateway } from '../realtime/recruiter.gateway';
import { RoundAdvanceService } from '../recruitment/round-advance.service';

const ACTIVE: InterviewStatus[] = [
  InterviewStatus.PENDING,
  InterviewStatus.INVITED,
  InterviewStatus.IN_PROGRESS,
];

export type ConversationStart =
  | { mode: 'voice'; url: string; token: string; roomName: string }
  | { mode: 'chat'; history: ConversationTurn[]; done: boolean };

/**
 * Conversational AI interview. Each interviewer utterance is stored as an
 * InterviewQuestion and the candidate's reply as its Answer, so reviews,
 * evaluation and the existing reports keep working.
 */
// livekit JobStatus: JS_PENDING = 0, JS_RUNNING = 1 (the enum isn't re-exported by livekit-server-sdk).
const JOB_ACTIVE = new Set([0, 1]);

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private readonly opening = new Map<string, Promise<ConversationTurn[]>>();
  private readonly planning = new Map<string, Promise<void>>();
  private readonly dispatching = new Map<string, Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly ai: AiClientService,
    private readonly interviewContext: InterviewContextService,
    private readonly evaluation: EvaluationService,
    private readonly recruiter: RecruiterGateway,
    private readonly proctoring: ProctoringService,
    private readonly roundAdvance: RoundAdvanceService,
  ) {}

  get voiceEnabled() {
    return Boolean(
      this.config.get<string>('livekit.url') &&
        this.config.get<string>('livekit.apiKey') &&
        this.config.get<string>('livekit.apiSecret'),
    );
  }

  async start(interviewId: string, candidateId: string): Promise<ConversationStart> {
    const interview = await this.getCandidateInterview(interviewId, candidateId);
    if (!ACTIVE.includes(interview.status)) {
      throw new BadRequestException('Interview not active');
    }
    if (interview.windowEnd < new Date()) {
      throw new BadRequestException('Interview window expired');
    }

    await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: InterviewStatus.IN_PROGRESS,
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

  /** Re-dispatch Tovia if the voice worker restarted while the candidate is already in the room. */
  async ensureVoiceAgent(interviewId: string, candidateId: string) {
    const interview = await this.getCandidateInterview(interviewId, candidateId);
    if (interview.status !== InterviewStatus.IN_PROGRESS) {
      throw new BadRequestException('Interview not in progress');
    }
    if (!(await this.useVoice())) {
      throw new BadRequestException('Voice mode is not enabled');
    }
    const roomName = `interview-${interviewId}`;
    const agentName = this.config.get<string>('livekit.agentName') ?? 'hiremind-interviewer';
    await this.dispatchVoiceAgent(roomName, agentName, interviewId);
    this.logger.log(`Dispatched voice agent for interview ${interviewId}`);
    return { dispatched: true, roomName };
  }

  /** INTERVIEW_MODE=voice|chat forces a mode; auto (default) uses voice when LiveKit and the agent are ready. */
  private async useVoice() {
    const mode = this.config.get<string>('interviewMode') ?? 'auto';
    if (mode === 'chat') return false;
    if (!this.voiceEnabled) return false;
    return mode === 'voice' || this.ai.voiceReady();
  }

  /** Builds the RAG question plan once per interview; a failure falls back to an unplanned interview. */
  private ensurePlan(interviewId: string, companyId: string): Promise<void> {
    const pending = this.planning.get(interviewId);
    if (pending) return pending;
    const run = (async () => {
      if ((await this.interviewContext.plan(interviewId)).length) return;
      try {
        await this.ai.planInterview(companyId, interviewId, await this.context(interviewId));
      } catch (err) {
        this.logger.warn(`Question plan failed for ${interviewId}: ${err}`);
      }
    })().finally(() => this.planning.delete(interviewId));
    this.planning.set(interviewId, run);
    return run;
  }

  /** Generates the greeting once, even if the candidate's browser calls start twice at the same time. */
  private openingTurn(interviewId: string, companyId: string): Promise<ConversationTurn[]> {
    const pending = this.opening.get(interviewId);
    if (pending) return pending;
    const run = (async () => {
      const history = await this.history(interviewId);
      if (history.length) return history;
      const first = await this.ai.chatTurn(companyId, await this.context(interviewId), []);
      await this.addTurn(interviewId, 'interviewer', first.reply);
      return this.history(interviewId);
    })().finally(() => this.opening.delete(interviewId));
    this.opening.set(interviewId, run);
    return run;
  }

  async chat(interviewId: string, candidateId: string, message: string) {
    const interview = await this.getCandidateInterview(interviewId, candidateId);
    if (interview.status !== InterviewStatus.IN_PROGRESS) {
      throw new BadRequestException('Interview not in progress');
    }
    if (interview.windowEnd < new Date()) {
      throw new BadRequestException('Interview window expired');
    }
    const text = message.trim();
    if (!text) {
      throw new BadRequestException('Message is empty');
    }

    await this.addTurn(interviewId, 'candidate', text);
    const turn = await this.ai.chatTurn(
      interview.companyId,
      await this.context(interviewId),
      await this.history(interviewId),
    );
    await this.addTurn(interviewId, 'interviewer', turn.reply);
    if (turn.done) {
      await this.complete(interviewId, 'completed');
    }
    return { reply: turn.reply, done: turn.done };
  }

  context(interviewId: string) {
    return this.interviewContext.context(interviewId);
  }

  history(interviewId: string) {
    return this.interviewContext.transcript(interviewId);
  }

  async planForStaff(companyId: string, interviewId: string) {
    await this.assertCompanyInterview(companyId, interviewId);
    return this.interviewContext.plan(interviewId);
  }

  /** Integrity concerns raised by the voice agent from what it hears. */
  agentProctoringEvent(interviewId: string, eventType: string, severity: string, detail: string) {
    return this.proctoring.ingestBatch(interviewId, [
      { eventType, severity, payload: { detail, source: 'ai_interviewer' }, clientTimestamp: new Date().toISOString() },
    ]);
  }

  private async assertCompanyInterview(companyId: string, interviewId: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, companyId, deletedAt: null },
      select: { id: true },
    });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }
  }

  async transcriptForStaff(companyId: string, interviewId: string) {
    await this.assertCompanyInterview(companyId, interviewId);
    return this.history(interviewId);
  }

  async addTurn(interviewId: string, role: ConversationTurn['role'], text: string) {
    const last = await this.prisma.interviewQuestion.findFirst({
      where: { interviewId },
      orderBy: { orderIndex: 'desc' },
      include: { answers: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (role === 'interviewer') {
      // Consecutive interviewer utterances (no reply in between) belong to one question.
      if (last && !last.answers.length) {
        await this.prisma.interviewQuestion.update({
          where: { id: last.id },
          data: { questionText: `${last.questionText} ${text}` },
        });
      } else {
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
    } else if (last) {
      const existing = last.answers[0];
      if (existing) {
        await this.prisma.answer.update({
          where: { id: existing.id },
          data: { transcript: `${existing.transcript ?? ''} ${text}`.trim() },
        });
      } else {
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

  async complete(interviewId: string, reason: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, deletedAt: null },
    });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }
    if (interview.status !== InterviewStatus.IN_PROGRESS) {
      return { completed: false, status: interview.status };
    }
    await this.prisma.interview.update({
      where: { id: interviewId },
      data: { status: InterviewStatus.COMPLETED, finishedAt: new Date() },
    });
    await this.prisma.candidateJob.updateMany({
      where: { candidateId: interview.candidateId, jobId: interview.jobId },
      data: { status: 'INTERVIEW_COMPLETED' },
    });
    await this.roundAdvance.afterInterviewCompleted(interviewId).catch(() => undefined);
    this.logger.log(`Interview ${interviewId} completed (${reason})`);
    // Score in the background; the recruiter can always re-run it from the UI.
    void this.evaluation
      .trigger(interviewId, interview.companyId)
      .catch((err) => this.logger.warn(`Auto-evaluation failed: ${err}`));
    return { completed: true };
  }

  private async voiceToken(
    interviewId: string,
    candidateId: string,
  ): Promise<ConversationStart> {
    const roomName = `interview-${interviewId}`;
    const at = new AccessToken(
      this.config.get<string>('livekit.apiKey'),
      this.config.get<string>('livekit.apiSecret'),
      { identity: `candidate-${candidateId}`, ttl: '2h' },
    );
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const agentName = this.config.get<string>('livekit.agentName') ?? 'hiremind-interviewer';
    await this.ensureRoom(roomName);
    // One explicit, idempotent dispatch covers the first join, rejoins and agent restarts.
    await this.dispatchVoiceAgent(roomName, agentName, interviewId);
    return {
      mode: 'voice',
      url: this.config.get<string>('livekit.url')!,
      token: await at.toJwt(),
      roomName,
    };
  }

  private livekitHttpUrl(): string {
    const url = this.config.get<string>('livekit.url')!;
    return url.replace(/^ws(s?):/i, 'http$1:');
  }

  /**
   * Creates the room up front so it outlives a dropped candidate: LiveKit closes a room
   * 20s after its last participant leaves by default, and the agent doesn't count.
   * Tovia waits REJOIN_GRACE_SECS (60s) for a rejoin, so the room must wait longer.
   */
  private async ensureRoom(roomName: string): Promise<void> {
    const rooms = new RoomServiceClient(
      this.livekitHttpUrl(),
      this.config.get<string>('livekit.apiKey'),
      this.config.get<string>('livekit.apiSecret'),
    );
    try {
      await rooms.createRoom({ name: roomName, departureTimeout: 120, emptyTimeout: 300 });
    } catch (err) {
      this.logger.warn(`LiveKit room create failed for ${roomName}: ${err}`);
    }
  }

  /** Dispatches Tovia unless a dispatch for this room is still waiting for a worker or running. */
  private dispatchVoiceAgent(roomName: string, agentName: string, interviewId: string): Promise<void> {
    // Concurrent callers (start + ensure-agent) share one check-then-create.
    const inflight = this.dispatching.get(roomName);
    if (inflight) return inflight;
    const run = this.dispatchOnce(roomName, agentName, interviewId).finally(() => this.dispatching.delete(roomName));
    this.dispatching.set(roomName, run);
    return run;
  }

  private async dispatchOnce(roomName: string, agentName: string, interviewId: string): Promise<void> {
    const client = new AgentDispatchClient(
      this.livekitHttpUrl(),
      this.config.get<string>('livekit.apiKey'),
      this.config.get<string>('livekit.apiSecret'),
    );
    try {
      const existing = await client.listDispatch(roomName);
      const active = existing.some(
        (d) =>
          d.agentName === agentName &&
          !d.state?.deletedAt &&
          // No job yet = waiting for a worker; otherwise a job that hasn't finished.
          (!d.state?.jobs.length || d.state.jobs.some((j) => JOB_ACTIVE.has(j.state?.status ?? -1))),
      );
      if (active) return;
      await client.createDispatch(roomName, agentName, {
        metadata: JSON.stringify({ interviewId }),
      });
    } catch (err) {
      this.logger.warn(`LiveKit agent dispatch failed for ${roomName}: ${err}`);
    }
  }

  private async getCandidateInterview(interviewId: string, candidateId: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, candidateId, deletedAt: null },
    });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }
    return interview;
  }
}

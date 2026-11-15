import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InterviewStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RoundAdvanceService } from '../recruitment/round-advance.service';

const RECONNECT_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly roundAdvance: RoundAdvanceService,
  ) {}

  async start(interviewId: string, candidateId: string) {
    const interview = await this.getCandidateInterview(interviewId, candidateId);
    this.assertWindowOpen(interview);
    if (
      interview.status === InterviewStatus.COMPLETED ||
      interview.status === InterviewStatus.TERMINATED ||
      interview.status === InterviewStatus.EXPIRED
    ) {
      throw new BadRequestException('Interview not active');
    }

    const existingQuestions = await this.prisma.interviewQuestion.count({
      where: { interviewId },
    });

    if (existingQuestions === 0) {
      const config = await this.prisma.jobInterviewConfig.findFirst({
        where: { jobId: interview.jobId },
      });
      const count = config?.questionCount ?? 5;
      const seeds = this.fakeQuestions(count);
      for (let i = 0; i < seeds.length; i++) {
        await this.prisma.interviewQuestion.create({
          data: {
            interviewId,
            orderIndex: i,
            questionText: seeds[i],
            questionType: i === count - 1 && config?.codingEnabled ? 'coding' : 'behavioral',
            timeLimitSec: 180,
          },
        });
      }
    }

    await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: InterviewStatus.IN_PROGRESS,
        startedAt: interview.startedAt ?? new Date(),
      },
    });

    await this.prisma.candidateJob.updateMany({
      where: {
        candidateId,
        jobId: interview.jobId,
      },
      data: { status: 'INTERVIEW_IN_PROGRESS' },
    });

    return this.nextQuestion(interviewId, candidateId);
  }

  async nextQuestion(interviewId: string, candidateId: string) {
    const interview = await this.getCandidateInterview(interviewId, candidateId);
    this.assertInProgress(interview);

    const answered = await this.prisma.interviewQuestion.findMany({
      where: {
        interviewId,
        answers: { some: { submittedAt: { not: null } } },
      },
      select: { id: true },
    });
    const answeredIds = new Set(answered.map((q) => q.id));

    const pending = await this.prisma.interviewQuestion.findMany({
      where: { interviewId },
      orderBy: { orderIndex: 'asc' },
    });

    const question = pending.find((q) => !answeredIds.has(q.id));
    if (!question) {
      return { done: true as const };
    }

    return {
      done: false as const,
      question: {
        id: question.id,
        orderIndex: question.orderIndex,
        questionText: question.questionText,
        questionType: question.questionType,
        timeLimitSec: question.timeLimitSec,
      },
      interviewEndsAt: interview.windowEnd,
    };
  }

  async submitAnswer(
    interviewId: string,
    candidateId: string,
    questionId: string,
    body: {
      text?: string;
      transcript?: string;
      code?: string;
      audioUrl?: string;
    },
  ) {
    const interview = await this.getCandidateInterview(interviewId, candidateId);
    this.assertInProgress(interview);
    this.assertWithinTimeLimit(interview);

    const question = await this.prisma.interviewQuestion.findFirst({
      where: { id: questionId, interviewId },
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const answer = await this.prisma.answer.create({
      data: {
        interviewQuestionId: questionId,
        text: body.text,
        transcript: body.transcript,
        code: body.code,
        audioUrl: body.audioUrl,
        submittedAt: new Date(),
        score: this.config.get<boolean>('ai.fakeMode') ? 0.8 : undefined,
        aiReasoning: this.config.get<boolean>('ai.fakeMode')
          ? 'FAKE_MODE: coherent answer'
          : undefined,
      },
    });

    if (body.transcript) {
      await this.prisma.transcriptSegment.create({
        data: {
          answerId: answer.id,
          segmentIndex: 0,
          text: body.transcript,
          isFinal: true,
        },
      });
    }

    return { answerId: answer.id };
  }

  async requestFollowUp(interviewId: string, candidateId: string, questionId: string) {
    const interview = await this.getCandidateInterview(interviewId, candidateId);
    this.assertInProgress(interview);

    const config = await this.prisma.jobInterviewConfig.findFirst({
      where: { jobId: interview.jobId },
    });
    const maxFollowUps = config?.maxFollowUps ?? 2;
    const followUpCount = await this.prisma.interviewQuestion.count({
      where: { interviewId, isFollowUp: true },
    });
    if (followUpCount >= maxFollowUps) {
      throw new BadRequestException('Follow-up limit reached');
    }

    const parent = await this.prisma.interviewQuestion.findFirst({
      where: { id: questionId, interviewId },
    });
    if (!parent) {
      throw new NotFoundException('Question not found');
    }

    const orderIndex =
      (await this.prisma.interviewQuestion.count({ where: { interviewId } })) +
      1;

    const followUp = await this.prisma.interviewQuestion.create({
      data: {
        interviewId,
        orderIndex,
        questionText: `Follow-up: Can you elaborate on your approach for question ${parent.orderIndex + 1}?`,
        questionType: 'behavioral',
        timeLimitSec: 120,
        isFollowUp: true,
        parentQuestionId: questionId,
      },
    });

    return { question: followUp };
  }

  async reconnect(interviewId: string, candidateId: string) {
    const interview = await this.getCandidateInterview(interviewId, candidateId);
    if (interview.status !== InterviewStatus.IN_PROGRESS) {
      throw new BadRequestException('Interview not in progress');
    }
    if (interview.reconnectUsedAt) {
      const elapsed = Date.now() - interview.reconnectUsedAt.getTime();
      if (elapsed > RECONNECT_WINDOW_MS) {
        throw new ForbiddenException('Reconnect already used');
      }
    }
    await this.prisma.interview.update({
      where: { id: interviewId },
      data: { reconnectUsedAt: new Date() },
    });
    return { reconnected: true, next: await this.nextQuestion(interviewId, candidateId) };
  }

  async finish(interviewId: string, candidateId: string) {
    const interview = await this.getCandidateInterview(interviewId, candidateId);
    await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: InterviewStatus.COMPLETED,
        finishedAt: new Date(),
      },
    });
    await this.prisma.candidateJob.updateMany({
      where: { candidateId, jobId: interview.jobId },
      data: { status: 'INTERVIEW_COMPLETED' },
    });
    await this.roundAdvance.afterInterviewCompleted(interviewId).catch(() => undefined);
    return { completed: true };
  }

  async sttToken(interviewId: string, candidateId: string) {
    await this.getCandidateInterview(interviewId, candidateId);
    const token = await this.jwt.signAsync(
      { sub: candidateId, interviewId, aud: 'stt' },
      {
        secret: this.config.get<string>('jwt.internalSecret'),
        expiresIn: '2m',
      },
    );
    const base = this.config.get<string>('appUrl') ?? 'http://localhost:3001';
    return {
      token,
      wsUrl: `${base.replace(/^http/, 'ws')}/ai/stt/stream`,
      expiresIn: 120,
    };
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

  private assertWindowOpen(interview: { windowEnd: Date; status: InterviewStatus }) {
    if (interview.windowEnd < new Date()) {
      throw new BadRequestException('Interview window expired');
    }
  }

  private assertInProgress(interview: { status: InterviewStatus; windowEnd: Date }) {
    this.assertWindowOpen(interview);
    if (
      interview.status !== InterviewStatus.IN_PROGRESS &&
      interview.status !== InterviewStatus.INVITED
    ) {
      throw new BadRequestException('Interview not in progress');
    }
  }

  private assertWithinTimeLimit(interview: {
    startedAt: Date | null;
    windowEnd: Date;
    jobId: string;
  }) {
    if (interview.windowEnd < new Date()) {
      throw new BadRequestException('Time limit exceeded');
    }
  }

  private fakeQuestions(count: number): string[] {
    const bank = [
      'Describe a scalable API you built with Node.js.',
      'How do you handle database migrations in production?',
      'Explain your approach to caching with Redis.',
      'Tell us about debugging a production incident.',
      'How would you design multi-tenant auth?',
      'Describe testing strategy for a NestJS service.',
    ];
    return bank.slice(0, count);
  }
}

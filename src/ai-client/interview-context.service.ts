import { Injectable, NotFoundException } from '@nestjs/common';
import { AiRunStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationTurn, InterviewContext, PlannedQuestion } from './ai-client.service';

/** Builds what hiremind-ai needs to interview or evaluate: resume, job, config, transcript. */
@Injectable()
export class InterviewContextService {
  constructor(private readonly prisma: PrismaService) {}

  async context(interviewId: string): Promise<InterviewContext> {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, deletedAt: null },
      include: {
        company: { select: { name: true } },
        job: {
          include: {
            interviewConfig: true,
            questionBanks: { where: { deletedAt: null }, select: { storageKey: true } },
          },
        },
        candidate: {
          include: {
            resumes: {
              where: { deletedAt: null, parsedText: { not: null } },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }
    const c = interview.candidate;
    const cfg = interview.job.interviewConfig;
    return {
      interview_id: interview.id,
      candidate_name:
        [c.firstName, c.lastName].filter(Boolean).join(' ') || 'the candidate',
      company_name: interview.company.name,
      job_title: interview.job.title,
      job_description: interview.job.description ?? '',
      resume_text: c.resumes[0]?.parsedText ?? '',
      question_count: cfg?.questionCount ?? 5,
      duration_minutes: cfg?.durationMinutes ?? 30,
      coding_enabled: cfg?.codingEnabled ?? false,
      jd_document_key: interview.job.jdStorageKey,
      question_bank_keys: interview.job.questionBanks.map((q) => q.storageKey),
      question_plan: await this.plan(interviewId),
    };
  }

  /** The latest successful RAG question plan for this interview, if one was generated. */
  async plan(interviewId: string): Promise<PlannedQuestion[]> {
    const run = await this.prisma.aiRun.findFirst({
      where: { interviewId, operation: 'interview_plan', status: AiRunStatus.SUCCEEDED },
      orderBy: { createdAt: 'desc' },
    });
    const summary = run?.responseSummary as { questions?: PlannedQuestion[] } | null;
    return summary?.questions ?? [];
  }

  /** Interviewer/candidate turns, rebuilt from InterviewQuestion + Answer rows. */
  async transcript(interviewId: string): Promise<ConversationTurn[]> {
    const questions = await this.prisma.interviewQuestion.findMany({
      where: { interviewId },
      orderBy: { orderIndex: 'asc' },
      include: { answers: { orderBy: { createdAt: 'asc' } } },
    });
    const turns: ConversationTurn[] = [];
    for (const q of questions) {
      turns.push({ role: 'interviewer', text: q.questionText });
      for (const a of q.answers) {
        const text = a.transcript ?? a.text ?? a.code;
        if (text) turns.push({ role: 'candidate', text });
      }
    }
    return turns;
  }
}

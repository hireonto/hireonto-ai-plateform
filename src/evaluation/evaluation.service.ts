import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiRunStatus } from '@prisma/client';
import { AiClientService } from '../ai-client/ai-client.service';
import { InterviewContextService } from '../ai-client/interview-context.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiClientService,
    private readonly interviewContext: InterviewContextService,
    private readonly config: ConfigService,
  ) {}

  async trigger(interviewId: string, companyId: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, companyId, deletedAt: null },
      include: {
        questions: { include: { answers: true } },
        proctoringEvents: true,
      },
    });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    const run = await this.prisma.aiRun.create({
      data: {
        companyId,
        interviewId,
        operation: 'full_evaluation',
        status: AiRunStatus.RUNNING,
        requestPayload: { interviewId },
      },
    });

    let report: ReturnType<EvaluationService['fakeEvaluation']>;
    try {
      report = await this.evaluate(interviewId, companyId);
    } catch (err) {
      await this.prisma.aiRun.update({
        where: { id: run.id },
        data: { status: AiRunStatus.FAILED, error: String(err) },
      });
      throw err;
    }
    await this.prisma.aiRun.update({
      where: { id: run.id },
      data: {
        status: AiRunStatus.SUCCEEDED,
        responseSummary: report as object,
        externalId: run.id,
      },
    });

    await this.prisma.evaluationReport.upsert({
      where: { interviewId },
      create: {
        interviewId,
        overallScore: report.overallScore,
        recommendation: report.recommendation,
        summary: report.summary,
        details: report.details as object,
      },
      update: {
        overallScore: report.overallScore,
        recommendation: report.recommendation,
        summary: report.summary,
        details: report.details as object,
      },
    });

    return { runId: run.id, report };
  }

  getReport(companyId: string, interviewId: string) {
    return this.prisma.evaluationReport.findFirst({
      where: { interview: { id: interviewId, companyId } },
    });
  }

  async override(
    companyId: string,
    interviewId: string,
    body: {
      overrideScore?: number;
      finalDecision?: string;
      humanOverride?: Record<string, unknown>;
    },
  ) {
    const report = await this.getReport(companyId, interviewId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return this.prisma.evaluationReport.update({
      where: { id: report.id },
      data: {
        finalDecision: body.finalDecision,
        humanOverride: {
          ...(body.humanOverride ?? {}),
          ...(body.overrideScore != null
            ? { overrideScore: body.overrideScore }
            : {}),
        } as object,
      },
    });
  }

  private async evaluate(interviewId: string, companyId: string) {
    if (this.config.get<boolean>('ai.fakeMode')) {
      return this.fakeEvaluation(interviewId);
    }
    const [context, transcript, events] = await Promise.all([
      this.interviewContext.context(interviewId),
      this.interviewContext.transcript(interviewId),
      // Live integrity signals (read-out answers, pastes, guardrail hits) inform the authenticity verdict.
      this.prisma.proctoringEvent.findMany({
        where: { interviewId, eventType: { in: ['AI_SUSPECTED_READING', 'PASTE'] } },
        select: { eventType: true },
      }),
    ]);
    const result = await this.ai.evaluateInterview(
      companyId,
      context,
      transcript,
      events.map((e) => e.eventType),
    );
    return {
      interviewId,
      overallScore: result.overallScore,
      recommendation: result.recommendation,
      summary: result.summary,
      details: {
        dimensions: result.dimensions,
        evidence: result.evidence,
        strengths: result.strengths,
        concerns: result.concerns,
        authenticity: result.authenticity,
      } as Record<string, unknown>,
    };
  }

  private fakeEvaluation(interviewId: string) {
    return {
      interviewId,
      overallScore: 0.78,
      recommendation: 'hire',
      summary: 'FAKE_MODE: Strong technical answers with minor proctoring flags.',
      details: { dimensions: { technical: 0.82, communication: 0.74 } } as Record<string, unknown>,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InterviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const STRIKE_TERMINATE_THRESHOLD = 3;

@Injectable()
export class ProctoringService {
  constructor(private readonly prisma: PrismaService) {}

  async ingestBatch(
    interviewId: string,
    events: Array<{
      eventType: string;
      severity?: string;
      payload?: Record<string, unknown>;
      clientTimestamp?: string;
    }>,
  ) {
    if (!events.length) {
      return { stored: 0, strikeCount: 0, terminated: false };
    }

    await this.prisma.proctoringEvent.createMany({
      data: events.map((e) => ({
        interviewId,
        eventType: e.eventType,
        severity: e.severity ?? 'info',
        payload: (e.payload ?? {}) as object,
        clientTimestamp: e.clientTimestamp
          ? new Date(e.clientTimestamp)
          : undefined,
      })),
    });

    const strikeEvents = events.filter(
      (e) => e.severity === 'strike' || e.eventType === 'TAB_SWITCH',
    );
    let terminated = false;
    let strikeCount = 0;

    if (strikeEvents.length) {
      const interview = await this.prisma.interview.update({
        where: { id: interviewId },
        data: { strikeCount: { increment: strikeEvents.length } },
      });
      strikeCount = interview.strikeCount;
      if (strikeCount >= STRIKE_TERMINATE_THRESHOLD) {
        await this.prisma.interview.update({
          where: { id: interviewId },
          data: { status: InterviewStatus.TERMINATED, finishedAt: new Date() },
        });
        terminated = true;
      }
    } else {
      const interview = await this.prisma.interview.findUnique({
        where: { id: interviewId },
      });
      strikeCount = interview?.strikeCount ?? 0;
    }

    return { stored: events.length, strikeCount, terminated };
  }

  timeline(interviewId: string) {
    return this.prisma.proctoringEvent.findMany({
      where: { interviewId },
      orderBy: { receivedAt: 'asc' },
    });
  }

  async recordDisconnect(interviewId: string) {
    return this.ingestBatch(interviewId, [
      { eventType: 'DISCONNECTED', severity: 'warning' },
    ]);
  }
}

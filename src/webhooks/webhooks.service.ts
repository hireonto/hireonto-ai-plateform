import { Injectable, Logger } from '@nestjs/common';
import { WebhookStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiWebhookDto } from './dto/ai-webhook.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async ingestAiWebhook(dto: AiWebhookDto) {
    const webhook = await this.prisma.webhook.create({
      data: {
        companyId: dto.companyId,
        source: 'hiremind-ai',
        eventType: dto.eventType,
        payload: dto.payload as object,
        status: WebhookStatus.PENDING,
      },
    });

    try {
      await this.dispatch(dto);
      await this.prisma.webhook.update({
        where: { id: webhook.id },
        data: { status: WebhookStatus.DELIVERED, processedAt: new Date() },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook ${webhook.id} failed: ${message}`);
      await this.prisma.webhook.update({
        where: { id: webhook.id },
        data: { status: WebhookStatus.FAILED, error: message },
      });
      throw err;
    }

    return { received: true, id: webhook.id };
  }

  private async dispatch(dto: AiWebhookDto) {
    switch (dto.eventType) {
      case 'evaluation.completed':
        if (dto.interviewId && dto.payload) {
          await this.prisma.evaluationReport.upsert({
            where: { interviewId: dto.interviewId },
            create: {
              interviewId: dto.interviewId,
              overallScore: Number(dto.payload.overallScore ?? 0),
              recommendation: String(dto.payload.recommendation ?? ''),
              summary: String(dto.payload.summary ?? ''),
              details: dto.payload as object,
            },
            update: {
              overallScore: Number(dto.payload.overallScore ?? 0),
              recommendation: String(dto.payload.recommendation ?? ''),
              summary: String(dto.payload.summary ?? ''),
              details: dto.payload as object,
            },
          });
        }
        break;
      case 'proctoring.analysis.completed':
        if (dto.interviewId) {
          await this.prisma.integrityReport.upsert({
            where: { interviewId: dto.interviewId },
            create: {
              interviewId: dto.interviewId,
              summary: dto.payload as object,
              riskScore: Number(dto.payload.riskScore ?? 0),
              flags: (dto.payload.flags as object) ?? [],
            },
            update: {
              summary: dto.payload as object,
              riskScore: Number(dto.payload.riskScore ?? 0),
              flags: (dto.payload.flags as object) ?? [],
            },
          });
        }
        break;
      default:
        this.logger.debug(`Unhandled AI webhook: ${dto.eventType}`);
    }

    if (dto.externalId) {
      await this.prisma.aiRun.updateMany({
        where: { externalId: dto.externalId },
        data: {
          responseSummary: dto.payload as object,
        },
      });
    }
  }
}

import { PrismaService } from '../prisma/prisma.service';
import { AiWebhookDto } from './dto/ai-webhook.dto';
export declare class WebhooksService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    ingestAiWebhook(dto: AiWebhookDto): Promise<{
        received: boolean;
        id: string;
    }>;
    private dispatch;
}

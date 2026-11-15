import { AiWebhookDto } from './dto/ai-webhook.dto';
import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooks;
    constructor(webhooks: WebhooksService);
    ai(dto: AiWebhookDto): Promise<{
        received: boolean;
        id: string;
    }>;
}

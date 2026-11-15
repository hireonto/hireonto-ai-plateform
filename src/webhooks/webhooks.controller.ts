import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AiWebhookDto } from './dto/ai-webhook.dto';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Public()
  @Post('ai')
  @ApiOperation({ summary: 'Receive hiremind-ai async callbacks' })
  ai(@Body() dto: AiWebhookDto) {
    return this.webhooks.ingestAiWebhook(dto);
  }
}

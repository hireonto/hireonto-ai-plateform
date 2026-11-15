import { All, Controller, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { createHttpProxy } from '../common/http-proxy';
import { Public } from '../common/decorators/public.decorator';

@ApiExcludeController()
@Controller('ai/stt')
export class SttController {
  private proxy = createHttpProxy({ ws: true, changeOrigin: true });

  constructor(private readonly config: ConfigService) {}

  @Public()
  @All('*')
  proxyRequest(@Req() req: Request, @Res() res: Response) {
    const target = this.config.get<string>('ai.serviceUrl') ?? 'http://localhost:8000';
    const path = req.url.replace(/^\/ai\/stt/, '/stt');
    req.url = path;
    this.proxy.web(req, res, { target }, (err: Error | null | undefined) => {
      res.status(502).json({ error: err?.message ?? 'STT proxy error' });
    });
  }
}

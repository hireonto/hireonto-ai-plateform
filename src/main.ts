import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { Logger } from 'nestjs-pino';
import { createHttpProxy } from './common/http-proxy';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './realtime/redis-io.adapter';
import { shutdownTracing, startTracing } from './tracing';

async function bootstrap() {
  startTracing();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  // Behind Railway's proxy: trust X-Forwarded-* so rate limits and logs see the real client IP.
  app.set('trust proxy', 1);
  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  // CORS: comma-separated CORS_ORIGINS (e.g. https://app.hireonto.com,https://hireonto.com).
  // Falls back to APP_URL in production, and to any origin in development.
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (!corsOrigins.length && process.env.APP_URL) corsOrigins.push(process.env.APP_URL.replace(/\/$/, ''));
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? corsOrigins : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get(ConfigService);
  const redisUrl = config.get<string>('redisUrl');
  if (redisUrl) {
    const redisIoAdapter = new RedisIoAdapter(app);
    try {
      await redisIoAdapter.connectToRedis(redisUrl);
      app.useWebSocketAdapter(redisIoAdapter);
    } catch {
      app.useWebSocketAdapter(redisIoAdapter);
    }
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('HireOnto API')
    .setDescription('HireOnto backend — auth, hiring workflow, interviews')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('port') ?? 3001;
  const server = await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`HireOnto API listening on :${port}`);
  logger.log(`Swagger UI → http://localhost:${port}/docs`);

  const aiUrl = config.get<string>('ai.serviceUrl') ?? 'http://localhost:8000';
  const sttProxy = createHttpProxy({ ws: true, changeOrigin: true });
  server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    if (req.url?.startsWith('/ai/stt')) {
      req.url = req.url.replace(/^\/ai\/stt/, '/stt');
      sttProxy.ws(req, socket, head, { target: aiUrl });
    }
  });
}
bootstrap().catch(async (err) => {
  await shutdownTracing();
  throw err;
});

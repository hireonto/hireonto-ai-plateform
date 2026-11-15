"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const nestjs_pino_1 = require("nestjs-pino");
const http_proxy_1 = require("./common/http-proxy");
const app_module_1 = require("./app.module");
const redis_io_adapter_1 = require("./realtime/redis-io.adapter");
const tracing_1 = require("./tracing");
async function bootstrap() {
    (0, tracing_1.startTracing)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    app.set('trust proxy', 1);
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.use((0, cookie_parser_1.default)());
    const corsOrigins = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((o) => o.trim().replace(/\/$/, ''))
        .filter(Boolean);
    if (!corsOrigins.length && process.env.APP_URL)
        corsOrigins.push(process.env.APP_URL.replace(/\/$/, ''));
    app.enableCors({
        origin: process.env.NODE_ENV === 'production' ? corsOrigins : true,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = app.get(config_1.ConfigService);
    const redisUrl = config.get('redisUrl');
    if (redisUrl) {
        const redisIoAdapter = new redis_io_adapter_1.RedisIoAdapter(app);
        try {
            await redisIoAdapter.connectToRedis(redisUrl);
            app.useWebSocketAdapter(redisIoAdapter);
        }
        catch {
            app.useWebSocketAdapter(redisIoAdapter);
        }
    }
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('HireOnto API')
        .setDescription('HireOnto backend — auth, hiring workflow, interviews')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = config.get('port') ?? 3001;
    const server = await app.listen(port);
    const logger = app.get(nestjs_pino_1.Logger);
    logger.log(`HireOnto API listening on :${port}`);
    logger.log(`Swagger UI → http://localhost:${port}/docs`);
    const aiUrl = config.get('ai.serviceUrl') ?? 'http://localhost:8000';
    const sttProxy = (0, http_proxy_1.createHttpProxy)({ ws: true, changeOrigin: true });
    server.on('upgrade', (req, socket, head) => {
        if (req.url?.startsWith('/ai/stt')) {
            req.url = req.url.replace(/^\/ai\/stt/, '/stt');
            sttProxy.ws(req, socket, head, { target: aiUrl });
        }
    });
}
bootstrap().catch(async (err) => {
    await (0, tracing_1.shutdownTracing)();
    throw err;
});
//# sourceMappingURL=main.js.map
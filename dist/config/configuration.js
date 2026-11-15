"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    appUrl: process.env.APP_URL ?? 'http://localhost:3000',
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
        refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
        internalSecret: process.env.JWT_INTERNAL_SECRET,
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        oauth: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
        },
    },
    microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        redirectUri: process.env.MICROSOFT_OAUTH_REDIRECT_URI,
        tenantId: process.env.MICROSOFT_TENANT_ID ?? 'common',
    },
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER,
    },
    backendPublicUrl: process.env.BACKEND_PUBLIC_URL ?? process.env.APP_URL?.replace(':3000', ':3001') ?? 'http://localhost:3001',
    s3: {
        endpoint: process.env.S3_ENDPOINT,
        bucket: process.env.S3_BUCKET ?? 'hiremind',
        accessKey: process.env.S3_ACCESS_KEY,
        secretKey: process.env.S3_SECRET_KEY,
        region: process.env.S3_REGION ?? 'us-east-1',
    },
    ai: {
        serviceUrl: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
        fakeMode: process.env.AI_FAKE_MODE === 'true',
    },
    interviewMode: process.env.INTERVIEW_MODE ?? 'auto',
    livekit: {
        url: process.env.LIVEKIT_URL,
        apiKey: process.env.LIVEKIT_API_KEY,
        apiSecret: process.env.LIVEKIT_API_SECRET,
        agentName: process.env.LIVEKIT_AGENT_NAME ?? 'hiremind-interviewer',
    },
    judge0: {
        url: process.env.JUDGE0_URL ?? 'http://localhost:2358',
    },
    retention: {
        recordingDays: parseInt(process.env.RECORDING_RETENTION_DAYS ?? '30', 10),
    },
    email: {
        provider: process.env.EMAIL_PROVIDER ?? 'smtp',
        from: process.env.EMAIL_FROM ?? 'HireMind <no-reply@hiremind.local>',
        smtp: {
            host: process.env.SMTP_HOST ?? 'localhost',
            port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
        },
    },
});
//# sourceMappingURL=configuration.js.map
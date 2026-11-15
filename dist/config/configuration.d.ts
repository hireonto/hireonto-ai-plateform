declare const _default: () => {
    nodeEnv: string;
    port: number;
    databaseUrl: string | undefined;
    redisUrl: string | undefined;
    appUrl: string;
    jwt: {
        accessSecret: string | undefined;
        refreshSecret: string | undefined;
        accessTtl: string;
        refreshTtl: string;
        internalSecret: string | undefined;
    };
    google: {
        clientId: string | undefined;
        oauth: {
            clientId: string | undefined;
            clientSecret: string | undefined;
            redirectUri: string | undefined;
        };
    };
    microsoft: {
        clientId: string | undefined;
        clientSecret: string | undefined;
        redirectUri: string | undefined;
        tenantId: string;
    };
    twilio: {
        accountSid: string | undefined;
        authToken: string | undefined;
        fromNumber: string | undefined;
    };
    backendPublicUrl: string;
    s3: {
        endpoint: string | undefined;
        bucket: string;
        accessKey: string | undefined;
        secretKey: string | undefined;
        region: string;
    };
    ai: {
        serviceUrl: string;
        fakeMode: boolean;
    };
    interviewMode: string;
    livekit: {
        url: string | undefined;
        apiKey: string | undefined;
        apiSecret: string | undefined;
        agentName: string;
    };
    judge0: {
        url: string;
    };
    retention: {
        recordingDays: number;
    };
    email: {
        provider: string;
        from: string;
        smtp: {
            host: string;
            port: number;
        };
    };
};
export default _default;

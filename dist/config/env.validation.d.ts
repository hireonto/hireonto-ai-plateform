declare enum NodeEnv {
    Development = "development",
    Production = "production",
    Test = "test"
}
export declare class EnvironmentVariables {
    NODE_ENV: NodeEnv;
    PORT: number;
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_TTL: string;
    JWT_REFRESH_TTL: string;
    JWT_INTERNAL_SECRET: string;
    GOOGLE_CLIENT_ID?: string;
    APP_URL?: string;
    S3_ENDPOINT?: string;
    S3_BUCKET?: string;
    S3_ACCESS_KEY?: string;
    S3_SECRET_KEY?: string;
    AI_SERVICE_URL?: string;
    AI_FAKE_MODE?: string;
    INTERVIEW_MODE?: string;
    LIVEKIT_URL?: string;
    LIVEKIT_API_KEY?: string;
    LIVEKIT_API_SECRET?: string;
    LIVEKIT_AGENT_NAME?: string;
    EMAIL_PROVIDER?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: number;
}
export declare function validateEnv(config: Record<string, unknown>): EnvironmentVariables;
export {};

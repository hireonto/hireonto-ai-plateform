import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  PORT: number = 3000;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_URL!: string;

  @IsString()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_ACCESS_TTL: string = '15m';

  @IsString()
  JWT_REFRESH_TTL: string = '7d';

  @IsString()
  JWT_INTERNAL_SECRET!: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  APP_URL?: string;

  @IsOptional()
  @IsString()
  S3_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  S3_BUCKET?: string;

  @IsOptional()
  @IsString()
  S3_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  S3_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  AI_SERVICE_URL?: string;

  @IsOptional()
  @IsString()
  AI_FAKE_MODE?: string;

  @IsOptional()
  @IsString()
  INTERVIEW_MODE?: string;

  @IsOptional()
  @IsString()
  LIVEKIT_URL?: string;

  @IsOptional()
  @IsString()
  LIVEKIT_API_KEY?: string;

  @IsOptional()
  @IsString()
  LIVEKIT_API_SECRET?: string;

  @IsOptional()
  @IsString()
  LIVEKIT_AGENT_NAME?: string;

  @IsOptional()
  @IsString()
  EMAIL_PROVIDER?: string;

  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsInt()
  SMTP_PORT?: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validated;
}

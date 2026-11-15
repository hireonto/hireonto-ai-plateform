import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class AiWebhookDto {
  @ApiProperty()
  @IsString()
  eventType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interviewId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty()
  @IsObject()
  payload!: Record<string, unknown>;
}

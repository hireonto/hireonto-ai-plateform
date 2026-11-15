import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  autoShortlistThreshold?: number;
}

export class JobInterviewConfigDto {
  @ApiPropertyOptional({ default: 45 })
  @IsOptional()
  @IsInt()
  @Min(10)
  durationMinutes?: number;

  @ApiPropertyOptional({ default: 72 })
  @IsOptional()
  @IsInt()
  @Min(1)
  windowHours?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  proctoringEnabled?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  codingEnabled?: boolean;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  questionCount?: number;
}

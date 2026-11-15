import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class BulkResumeItemDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  fileName!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  contentType!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;
}

export class BulkResumeUploadDto {
  @ApiProperty({ type: [BulkResumeItemDto], maxItems: 50 })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BulkResumeItemDto)
  files!: BulkResumeItemDto[];
}

export class ConfirmBulkUploadDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  resumeIds!: string[];
}

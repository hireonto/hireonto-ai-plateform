import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class UpdateTenantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#2563eb' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#1e40af' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  secondaryColor?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

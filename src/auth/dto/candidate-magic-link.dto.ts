import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CandidateMagicLinkRequestDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  interviewToken?: string;
}

export class CandidateLoginDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  tempPassword?: string;
}

export class CandidateInterviewLoginDto {
  @ApiProperty()
  @IsString()
  accessToken!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  tempPassword!: string;
}

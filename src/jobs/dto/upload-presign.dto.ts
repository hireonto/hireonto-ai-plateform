import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class JdPresignDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  fileName!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  contentType!: string;
}

export class QuestionBankPresignDto extends JdPresignDto {}

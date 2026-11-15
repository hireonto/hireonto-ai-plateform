import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CodingService } from './coding.service';

@ApiTags('coding')
@ApiBearerAuth()
@Controller('sessions/:interviewId/coding')
export class CodingController {
  constructor(private readonly coding: CodingService) {}

  @Post('answers/:answerId/run')
  @ApiOperation({ summary: 'Run sample tests via Judge0' })
  run(
    @CurrentUser() _user: JwtPayload,
    @Param('answerId') answerId: string,
    @Body() body: { languageId: number; sourceCode: string; stdin?: string },
  ) {
    return this.coding.runSample({
      answerId,
      languageId: body.languageId,
      sourceCode: body.sourceCode,
      stdin: body.stdin,
    });
  }

  @Post('answers/:answerId/submit')
  @ApiOperation({ summary: 'Submit hidden tests via Judge0' })
  submit(
    @CurrentUser() _user: JwtPayload,
    @Param('answerId') answerId: string,
    @Body() body: { languageId: number; sourceCode: string },
  ) {
    return this.coding.submitHidden({
      answerId,
      languageId: body.languageId,
      sourceCode: body.sourceCode,
    });
  }
}

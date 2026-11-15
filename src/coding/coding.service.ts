import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CodeSubmissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CodingService {
  private readonly logger = new Logger(CodingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async runSample(params: {
    answerId: string;
    languageId: number;
    sourceCode: string;
    stdin?: string;
  }) {
    return this.submitToJudge0(params, false);
  }

  async submitHidden(params: {
    answerId: string;
    languageId: number;
    sourceCode: string;
  }) {
    return this.submitToJudge0(params, true);
  }

  private async submitToJudge0(
    params: {
      answerId: string;
      languageId: number;
      sourceCode: string;
      stdin?: string;
    },
    isHiddenTest: boolean,
  ) {
    const submission = await this.prisma.codeSubmission.create({
      data: {
        answerId: params.answerId,
        languageId: params.languageId,
        sourceCode: params.sourceCode,
        stdin: params.stdin,
        status: CodeSubmissionStatus.PENDING,
        isHiddenTest,
      },
    });

    const fakeMode = this.config.get<boolean>('ai.fakeMode');
    if (fakeMode) {
      const updated = await this.prisma.codeSubmission.update({
        where: { id: submission.id },
        data: {
          status: CodeSubmissionStatus.ACCEPTED,
          stdout: 'OK\n',
          passedTests: isHiddenTest ? 5 : 2,
          totalTests: isHiddenTest ? 5 : 2,
        },
      });
      return updated;
    }

    const judge0Url =
      this.config.get<string>('judge0.url') ?? 'http://localhost:2358';
    try {
      const res = await fetch(`${judge0Url}/submissions?base64_encoded=false`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: params.sourceCode,
          language_id: params.languageId,
          stdin: params.stdin ?? '',
        }),
      });
      const data = (await res.json()) as { token?: string };
      const token = data.token;
      let result: Record<string, unknown> = {};
      if (token) {
        await new Promise((r) => setTimeout(r, 1500));
        const poll = await fetch(`${judge0Url}/submissions/${token}`);
        result = (await poll.json()) as Record<string, unknown>;
      }
      const statusDesc =
        typeof result.status === 'object' &&
        result.status &&
        'description' in result.status
          ? String((result.status as { description?: string }).description ?? '')
          : '';
      const status = mapJudgeStatus(statusDesc);
      return this.prisma.codeSubmission.update({
        where: { id: submission.id },
        data: {
          judge0Token: token,
          status,
          stdout: String(result.stdout ?? ''),
          stderr: String(result.stderr ?? ''),
        },
      });
    } catch (err) {
      this.logger.warn(`Judge0 error: ${err}`);
      return this.prisma.codeSubmission.update({
        where: { id: submission.id },
        data: { status: CodeSubmissionStatus.RUNTIME_ERROR },
      });
    }
  }
}

function mapJudgeStatus(desc: string): CodeSubmissionStatus {
  if (desc.includes('Accepted')) {
    return CodeSubmissionStatus.ACCEPTED;
  }
  if (desc.includes('Wrong')) {
    return CodeSubmissionStatus.WRONG_ANSWER;
  }
  if (desc.includes('Time')) {
    return CodeSubmissionStatus.TIME_LIMIT;
  }
  if (desc.includes('Compilation')) {
    return CodeSubmissionStatus.COMPILE_ERROR;
  }
  return CodeSubmissionStatus.RUNTIME_ERROR;
}

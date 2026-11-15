import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { CandidateJobStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { AiClientService } from '../ai-client/ai-client.service';
import { PrismaService } from '../prisma/prisma.service';
import { RESUME_PARSE_QUEUE, ResumeParseJobData } from './candidates.constants';

@Processor(RESUME_PARSE_QUEUE)
export class CandidatesProcessor extends WorkerHost {
  private readonly logger = new Logger(CandidatesProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiClientService,
  ) {
    super();
  }

  async process(job: Job<ResumeParseJobData>) {
    const { companyId, jobId, candidateId, resumeId, storageKey } = job.data;
    this.logger.log(`Parsing resume ${resumeId}`);

    const parsed = await this.ai.parseResume({
      companyId,
      resumeId,
      storageKey,
      jobId,
    });

    await this.prisma.resume.update({
      where: { id: resumeId },
      data: {
        parseStatus: 'parsed',
        parsedText: parsed.text,
      },
    });

    const jobRecord = await this.prisma.job.findUnique({ where: { id: jobId } });
    const fit = await this.ai.scoreFit({
      companyId,
      candidateJobId: '',
      jobDescription: jobRecord?.description ?? jobRecord?.title ?? '',
      resumeText: parsed.text,
    });

    const candidateJob = await this.prisma.candidateJob.findUnique({
      where: { candidateId_jobId: { candidateId, jobId } },
    });

    if (candidateJob) {
      await this.prisma.candidateJob.update({
        where: { id: candidateJob.id },
        data: {
          status: CandidateJobStatus.PARSED,
          fitScore: fit.score,
          fitExplanation: fit.explanation,
        },
      });
    }

    return { resumeId, fitScore: fit.score };
  }
}

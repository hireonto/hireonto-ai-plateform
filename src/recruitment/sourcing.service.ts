import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CandidateJobStatus,
  Prisma,
  SourcingSource,
} from '@prisma/client';
import { AiClientService } from '../ai-client/ai-client.service';
import { CandidatesService } from '../candidates/candidates.service';
import { PrismaService } from '../prisma/prisma.service';
import { contentHash, scoreAtsResume } from './ats.util';
import { PlanFeaturesService } from './plan-features.service';

export type IngestResumeDto = {
  source: SourcingSource;
  externalId?: string;
  fileName: string;
  resumeText: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

@Injectable()
export class SourcingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planFeatures: PlanFeaturesService,
    private readonly candidates: CandidatesService,
    private readonly ai: AiClientService,
  ) {}

  async getConfig(companyId: string, jobId: string) {
    await this.assertJob(companyId, jobId);
    return this.prisma.sourcingAgentConfig.upsert({
      where: { jobId },
      create: { jobId },
      update: {},
    });
  }

  async upsertConfig(
    companyId: string,
    jobId: string,
    data: {
      enabled?: boolean;
      sources?: SourcingSource[];
      atsMinScore?: number;
      nonAtsMaxPercent?: number;
      searchKeywords?: string;
    },
  ) {
    await this.planFeatures.require(companyId, 'sourcing_agent');
    await this.assertJob(companyId, jobId);
    return this.prisma.sourcingAgentConfig.upsert({
      where: { jobId },
      create: { jobId, ...data },
      update: data,
    });
  }

  /** Run agent: ingest pending external resumes (stub fetch — use ingest API for real files). */
  async runAgent(companyId: string, jobId: string, payloads: IngestResumeDto[]) {
    await this.planFeatures.require(companyId, 'sourcing_agent');
    const cfg = await this.getConfig(companyId, jobId);
    if (!cfg.enabled) throw new BadRequestException('Sourcing agent is disabled for this job');

    const job = await this.assertJob(companyId, jobId);
    const items = payloads.length ? payloads : this.demoExternalResumes(job.title, cfg.searchKeywords ?? job.title);

    let ingested = 0;
    let skippedDup = 0;
    let skippedAts = 0;
    let nonAtsUsed = 0;
    const nonAtsBudget = Math.ceil((items.length || 1) * (cfg.nonAtsMaxPercent / 100));

    for (const p of items) {
      if (!cfg.sources.includes(p.source) && p.source !== SourcingSource.MANUAL) continue;
      const hash = contentHash(p.resumeText);
      const existing = await this.prisma.resumeIngestFingerprint.findUnique({
        where: { jobId_contentHash: { jobId, contentHash: hash } },
      });
      if (existing) {
        skippedDup++;
        continue;
      }

      const { score, atsFriendly } = scoreAtsResume(p.resumeText);
      if (score < cfg.atsMinScore) {
        if (!atsFriendly && nonAtsUsed < nonAtsBudget) {
          nonAtsUsed++;
        } else {
          skippedAts++;
          await this.prisma.resumeIngestFingerprint.create({
            data: {
              jobId,
              source: p.source,
              externalId: p.externalId,
              contentHash: hash,
              atsScore: score,
            },
          });
          continue;
        }
      }

      const candidate = await this.candidates.createFromTextResume(companyId, {
        jobId,
        fileName: p.fileName,
        resumeText: p.resumeText,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
      });

      const jobRecord = await this.prisma.job.findUnique({ where: { id: jobId } });
      const fit = await this.ai.scoreFit({
        companyId,
        candidateJobId: '',
        jobDescription: jobRecord?.description ?? jobRecord?.title ?? '',
        resumeText: p.resumeText,
      });
      const cj = await this.prisma.candidateJob.findUnique({
        where: { candidateId_jobId: { candidateId: candidate.candidateId, jobId } },
      });
      if (cj) {
        await this.prisma.candidateJob.update({
          where: { id: cj.id },
          data: { fitScore: fit.score, fitExplanation: fit.explanation },
        });
      }

      await this.prisma.resumeIngestFingerprint.create({
        data: {
          jobId,
          source: p.source,
          externalId: p.externalId,
          contentHash: hash,
          candidateId: candidate.candidateId,
          resumeId: candidate.resumeId,
          atsScore: score,
        },
      });
      ingested++;
    }

    const summary = { ingested, skippedDup, skippedAts, nonAtsUsed, attempted: items.length, demo: !payloads.length };
    await this.prisma.sourcingAgentConfig.update({
      where: { jobId },
      data: { lastRunAt: new Date(), lastRunSummary: summary as Prisma.InputJsonValue },
    });
    return summary;
  }

  async ingestOne(companyId: string, jobId: string, dto: IngestResumeDto) {
    return this.runAgent(companyId, jobId, [dto]);
  }

  /** Placeholder fetch until Naukri/LinkedIn API keys are wired — ATS-friendly sample resumes. */
  private demoExternalResumes(jobTitle: string, keywords: string): IngestResumeDto[] {
    const k = keywords || jobTitle;
    return [
      {
        source: SourcingSource.NAUKRI,
        externalId: `naukri-demo-${Date.now()}-1`,
        fileName: 'priya-naukri.txt',
        firstName: 'Priya',
        lastName: 'Verma',
        email: `priya.demo.${Date.now()}@example.com`,
        phone: '+919876543210',
        resumeText: `Priya Verma — ${k}\nSkills: TypeScript, Node.js, PostgreSQL, React, AWS\nExperience: 5 years backend engineer\nEducation: B.Tech CS\nATS keywords: ${k}, microservices, REST API`,
      },
      {
        source: SourcingSource.LINKEDIN,
        externalId: `linkedin-demo-${Date.now()}-2`,
        fileName: 'arjun-linkedin.txt',
        firstName: 'Arjun',
        lastName: 'Mehta',
        email: `arjun.demo.${Date.now()}@example.com`,
        resumeText: `Arjun Mehta\n${k} specialist | Java | Spring | Kafka\n3 yrs product company\nSummary aligned to ${jobTitle}`,
      },
    ];
  }

  private async assertJob(companyId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, companyId, deletedAt: null } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }
}

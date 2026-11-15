import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async funnel(companyId: string, jobId?: string) {
    const where = { companyId, ...(jobId ? { jobId } : {}) };
    const statuses = await this.prisma.candidateJob.groupBy({
      by: ['status'],
      where: { ...where, deletedAt: null },
      _count: true,
    });
    return { funnel: statuses };
  }

  async perJob(companyId: string) {
    const jobs = await this.prisma.job.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        title: true,
        candidateJobs: {
          where: { deletedAt: null },
          select: { status: true, fitScore: true },
        },
        interviews: {
          where: { deletedAt: null },
          select: { status: true },
        },
      },
    });
    return jobs.map((j) => ({
      jobId: j.id,
      title: j.title,
      candidates: j.candidateJobs.length,
      avgFit:
        j.candidateJobs.filter((c) => c.fitScore != null).reduce(
          (a, c) => a + (c.fitScore ?? 0),
          0,
        ) / Math.max(1, j.candidateJobs.filter((c) => c.fitScore != null).length),
      interviews: j.interviews.length,
      completedInterviews: j.interviews.filter((i) => i.status === 'COMPLETED')
        .length,
    }));
  }

  async perRecruiter(companyId: string) {
    const users = await this.prisma.user.findMany({
      where: { companyId, role: { in: ['ADMIN', 'RECRUITER'] }, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
    const jobs = await this.prisma.job.groupBy({
      by: ['createdById'],
      where: { companyId, deletedAt: null, createdById: { not: null } },
      _count: true,
    });
    return users.map((u) => ({
      user: u,
      jobsCreated: jobs.find((g) => g.createdById === u.id)?._count ?? 0,
    }));
  }

  async integrity(companyId: string) {
    const reports = await this.prisma.integrityReport.findMany({
      where: { interview: { companyId } },
      select: { riskScore: true, interviewId: true },
    });
    const avgRisk =
      reports.reduce((a, r) => a + (r.riskScore ?? 0), 0) /
      Math.max(1, reports.length);
    const terminated = await this.prisma.interview.count({
      where: { companyId, status: 'TERMINATED' },
    });
    return { avgRisk, terminatedCount: terminated, sampleSize: reports.length };
  }
}

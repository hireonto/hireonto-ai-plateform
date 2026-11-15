import {
  CandidateJobStatus,
  PrismaClient,
  UserRole,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const planFeatures = {
    sourcing_agent: true,
    pstn_outbound: true,
    calendar_sync: true,
    multi_round: true,
  };
  const plan = await prisma.plan.upsert({
    where: { name: 'Starter' },
    update: { features: planFeatures },
    create: {
      name: 'Starter',
      interviewsPerMonth: 100,
      maxActiveJobs: 20,
      maxUsers: 50,
      features: planFeatures,
    },
  });

  const company = await prisma.company.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme',
      planId: plan.id,
      timezone: 'Asia/Kolkata',
    },
  });

  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

  const admin = await prisma.user.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email: 'admin@acme.hiremind.local',
      },
    },
    update: { passwordHash, status: UserStatus.ACTIVE },
    create: {
      companyId: company.id,
      email: 'admin@acme.hiremind.local',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash,
    },
  });

  const recruiters = [
    {
      email: 'recruiter1@acme.hiremind.local',
      firstName: 'Riya',
      lastName: 'Sharma',
    },
    {
      email: 'recruiter2@acme.hiremind.local',
      firstName: 'Arjun',
      lastName: 'Patel',
    },
  ];

  for (const r of recruiters) {
    await prisma.user.upsert({
      where: { companyId_email: { companyId: company.id, email: r.email } },
      update: { passwordHash, status: UserStatus.ACTIVE },
      create: {
        companyId: company.id,
        email: r.email,
        firstName: r.firstName,
        lastName: r.lastName,
        role: UserRole.RECRUITER,
        status: UserStatus.ACTIVE,
        passwordHash,
      },
    });
  }

  await prisma.user.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email: 'interviewer@acme.hiremind.local',
      },
    },
    update: { passwordHash, status: UserStatus.ACTIVE },
    create: {
      companyId: company.id,
      email: 'interviewer@acme.hiremind.local',
      firstName: 'Neha',
      lastName: 'Iyer',
      role: UserRole.INTERVIEWER,
      status: UserStatus.ACTIVE,
      passwordHash,
    },
  });

  const periodStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const periodEnd = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  );

  await prisma.usage.upsert({
    where: { companyId_periodStart: { companyId: company.id, periodStart } },
    update: {},
    create: {
      companyId: company.id,
      periodStart,
      periodEnd,
      interviewsUsed: 0,
    },
  });

  const job = await prisma.job.upsert({
    where: { id: 'seed-job-backend-engineer' },
    update: {},
    create: {
      id: 'seed-job-backend-engineer',
      companyId: company.id,
      title: 'Backend Engineer (Node)',
      description:
        'Build scalable APIs with Node.js, NestJS, PostgreSQL, and Redis. 3+ years experience.',
      location: 'Remote',
      createdById: admin.id,
      interviewConfig: {
        create: { durationMinutes: 45, codingEnabled: true, questionCount: 5 },
      },
    },
  });

  const sampleCandidates = Array.from({ length: 10 }).map((_, i) => ({
    email: `candidate${i + 1}@demo.hiremind.local`,
    firstName: `Candidate`,
    lastName: `${i + 1}`,
    fileName: `resume-${i + 1}.pdf`,
  }));

  for (const c of sampleCandidates) {
    const candidate = await prisma.candidate.upsert({
      where: {
        id: `seed-candidate-${c.email}`,
      },
      update: {},
      create: {
        id: `seed-candidate-${c.email}`,
        companyId: company.id,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        timezone: 'Asia/Kolkata',
      },
    });

    await prisma.candidateJob.upsert({
      where: {
        candidateId_jobId: { candidateId: candidate.id, jobId: job.id },
      },
      update: {},
      create: {
        companyId: company.id,
        candidateId: candidate.id,
        jobId: job.id,
        status: CandidateJobStatus.PARSED,
        fitScore: 0.55 + Math.random() * 0.4,
        fitExplanation: 'Seed data — run bulk upload flow for live parsing.',
      },
    });

    await prisma.resume.upsert({
      where: { id: `seed-resume-${candidate.id}` },
      update: {},
      create: {
        id: `seed-resume-${candidate.id}`,
        companyId: company.id,
        candidateId: candidate.id,
        storageKey: `companies/${company.id}/resumes/seed-${c.fileName}`,
        fileName: c.fileName,
        mimeType: 'application/pdf',
        parseStatus: 'parsed',
        parsedText: `Seed resume for ${c.firstName} ${c.lastName}. Node.js, NestJS, PostgreSQL.`,
      },
    });
  }

  console.log('Seed complete:', {
    companyId: company.id,
    adminId: admin.id,
    jobId: job.id,
    candidates: sampleCandidates.length,
    aiFakeMode: process.env.AI_FAKE_MODE ?? 'set in .env',
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import {
  CandidateJobStatus,
  PrismaClient,
  UserRole,
  UserStatus,
} from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Hiring flow (e2e, fake AI)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  let accessToken: string;
  let jobId: string;
  let companyId: string;
  let candidateJobId: string;
  let interviewId: string;
  let candidateToken: string;

  beforeAll(async () => {
    process.env.AI_FAKE_MODE = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const plan = await prisma.plan.upsert({
      where: { name: 'Flow Plan' },
      update: {},
      create: { name: 'Flow Plan', interviewsPerMonth: 50 },
    });
    const company = await prisma.company.upsert({
      where: { slug: 'flow-co' },
      update: {},
      create: { name: 'Flow Co', slug: 'flow-co', planId: plan.id },
    });
    companyId = company.id;
    const passwordHash = await bcrypt.hash('FlowPass123!', 12);
    await prisma.user.upsert({
      where: {
        companyId_email: {
          companyId,
          email: 'flow-admin@test.local',
        },
      },
      update: { passwordHash, status: UserStatus.ACTIVE },
      create: {
        companyId,
        email: 'flow-admin@test.local',
        firstName: 'Flow',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        passwordHash,
      },
    });

    const login = await request(app.getHttpServer())
      .post('/auth/staff/login')
      .send({ email: 'flow-admin@test.local', password: 'FlowPass123!' });
    accessToken = login.body.accessToken;

    const job = await request(app.getHttpServer())
      .post('/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'E2E Backend Engineer',
        description: 'Node NestJS PostgreSQL',
        autoShortlistThreshold: 0.6,
      });
    jobId = job.body.id;

    const candidate = await prisma.candidate.create({
      data: {
        companyId,
        email: 'flow-candidate@test.local',
        firstName: 'Flow',
        lastName: 'Candidate',
      },
    });
    const cj = await prisma.candidateJob.create({
      data: {
        companyId,
        candidateId: candidate.id,
        jobId,
        status: CandidateJobStatus.PARSED,
        fitScore: 0.85,
        fitExplanation: 'E2E seed fit',
      },
    });
    candidateJobId = cj.id;
  }, 60000);

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('auto shortlist → interview → session → evaluation', async () => {
    const shortlist = await request(app.getHttpServer())
      .post(`/jobs/${jobId}/shortlist/auto`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    expect(shortlist.body.updated).toBeGreaterThanOrEqual(1);

    const interviews = await request(app.getHttpServer())
      .post(`/interviews/jobs/${jobId}/from-shortlist`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ candidateJobIds: [candidateJobId] })
      .expect(201);
    expect(interviews.body.created.length).toBe(1);
    interviewId = interviews.body.created[0].interviewId;

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });
    await prisma.candidate.update({
      where: { id: interview!.candidateId },
      data: {
        tempPasswordHash: null,
        magicLinkToken: 'flow-magic-token',
        magicLinkExpiresAt: new Date(Date.now() + 3600000),
      },
    });

    const candLogin = await request(app.getHttpServer())
      .post('/auth/candidate/login')
      .send({ token: 'flow-magic-token', tempPassword: undefined })
      .expect(201);
    candidateToken = candLogin.body.accessToken;

    await request(app.getHttpServer())
      .post(`/sessions/${interviewId}/start`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(201);

    const next = await request(app.getHttpServer())
      .get(`/sessions/${interviewId}/next-question`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);
    expect(next.body.done).toBe(false);

    await request(app.getHttpServer())
      .post(`/sessions/${interviewId}/questions/${next.body.question.id}/answer`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ text: 'I built Nest APIs with Prisma and Redis.' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/sessions/${interviewId}/finish`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(201);

    const evalRes = await request(app.getHttpServer())
      .post(`/interviews/${interviewId}/evaluation/trigger`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    expect(evalRes.body.report.overallScore).toBeDefined();

    const analytics = await request(app.getHttpServer())
      .get('/analytics/funnel')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(analytics.body.funnel).toBeDefined();
  });
});

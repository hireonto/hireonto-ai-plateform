import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  let companyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const plan = await prisma.plan.upsert({
      where: { name: 'E2E Plan' },
      update: {},
      create: { name: 'E2E Plan', interviewsPerMonth: 10 },
    });
    const company = await prisma.company.upsert({
      where: { slug: 'e2e-co' },
      update: {},
      create: { name: 'E2E Co', slug: 'e2e-co', planId: plan.id },
    });
    companyId = company.id;
    const passwordHash = await bcrypt.hash('TestPass123!', 12);
    await prisma.user.upsert({
      where: {
        companyId_email: {
          companyId,
          email: 'e2e-admin@test.local',
        },
      },
      update: { passwordHash, status: UserStatus.ACTIVE },
      create: {
        companyId,
        email: 'e2e-admin@test.local',
        firstName: 'E2E',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        passwordHash,
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('POST /auth/staff/login returns tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/staff/login')
      .send({ email: 'e2e-admin@test.local', password: 'TestPass123!' })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('GET /users/me requires auth', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('GET /users/me works with token', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/staff/login')
      .send({ email: 'e2e-admin@test.local', password: 'TestPass123!' });

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe('e2e-admin@test.local');
        expect(res.body.company.id).toBe(companyId);
      });
  });
});

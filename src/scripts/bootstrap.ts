/**
 * Production bootstrap: creates the first plan, company and admin user from env vars.
 * Safe to run on every deploy — it never overwrites an existing company or user (or their password).
 *
 *   BOOTSTRAP_COMPANY_NAME   e.g. "HireOnto"
 *   BOOTSTRAP_COMPANY_SLUG   optional, defaults to a slug of the name
 *   BOOTSTRAP_ADMIN_EMAIL    first admin's login email
 *   BOOTSTRAP_ADMIN_PASSWORD first admin's password (min 12 chars) — change it after first login
 *
 * Skips quietly when the variables are not set.
 */
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const name = process.env.BOOTSTRAP_COMPANY_NAME?.trim();
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? '';
  if (!name || !email || !password) {
    console.log('[bootstrap] BOOTSTRAP_* not set — skipping.');
    return;
  }
  if (password.length < 12) throw new Error('[bootstrap] BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.');
  const slug =
    process.env.BOOTSTRAP_COMPANY_SLUG?.trim() ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const prisma = new PrismaClient();
  try {
    const plan = await prisma.plan.upsert({
      where: { name: 'Starter' },
      update: {},
      create: {
        name: 'Starter',
        interviewsPerMonth: 100,
        maxActiveJobs: 20,
        maxUsers: 50,
        features: { sourcing_agent: true, pstn_outbound: true, calendar_sync: true, multi_round: true },
      },
    });

    const company = await prisma.company.upsert({
      where: { slug },
      update: {},
      create: { name, slug, planId: plan.id, timezone: process.env.BOOTSTRAP_TIMEZONE ?? 'UTC' },
    });

    const existing = await prisma.user.findUnique({ where: { companyId_email: { companyId: company.id, email } } });
    if (existing) {
      console.log(`[bootstrap] Admin ${email} already exists in "${company.name}" — nothing to do.`);
      return;
    }
    await prisma.user.create({
      data: {
        companyId: company.id,
        email,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
    console.log(`[bootstrap] Created admin ${email} for "${company.name}" (/${slug}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
async function main() {
    const name = process.env.BOOTSTRAP_COMPANY_NAME?.trim();
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? '';
    if (!name || !email || !password) {
        console.log('[bootstrap] BOOTSTRAP_* not set — skipping.');
        return;
    }
    if (password.length < 12)
        throw new Error('[bootstrap] BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.');
    const slug = process.env.BOOTSTRAP_COMPANY_SLUG?.trim() ||
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    const prisma = new client_1.PrismaClient();
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
                role: client_1.UserRole.ADMIN,
                status: client_1.UserStatus.ACTIVE,
                passwordHash: await bcrypt.hash(password, 12),
            },
        });
        console.log(`[bootstrap] Created admin ${email} for "${company.name}" (/${slug}).`);
    }
    finally {
        await prisma.$disconnect();
    }
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=bootstrap.js.map
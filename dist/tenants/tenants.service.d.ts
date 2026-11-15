import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
export declare class TenantsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCompany(companyId: string): Promise<{
        plan: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            deletedAt: Date | null;
            interviewsPerMonth: number;
            maxActiveJobs: number;
            maxUsers: number;
            features: import("@prisma/client/runtime/library").JsonValue;
        };
        usage: {
            id: string;
            createdAt: Date;
            companyId: string;
            updatedAt: Date;
            periodStart: Date;
            periodEnd: Date;
            interviewsUsed: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        deletedAt: Date | null;
        timezone: string;
        slug: string;
        planId: string;
        logoUrl: string | null;
        primaryColor: string | null;
        secondaryColor: string | null;
        integrations: import("@prisma/client/runtime/library").JsonValue;
    }>;
    updateBranding(companyId: string, dto: UpdateTenantDto): import(".prisma/client").Prisma.Prisma__CompanyClient<{
        plan: {
            id: string;
            name: string;
            interviewsPerMonth: number;
        };
        id: string;
        name: string;
        timezone: string;
        slug: string;
        logoUrl: string | null;
        primaryColor: string | null;
        secondaryColor: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}

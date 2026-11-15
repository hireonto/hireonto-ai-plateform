import { PrismaService } from '../prisma/prisma.service';
export type PlanFeatureKey = 'sourcing_agent' | 'pstn_outbound' | 'calendar_sync' | 'multi_round';
export declare class PlanFeaturesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    featuresForCompany(companyId: string): Promise<Record<PlanFeatureKey, boolean>>;
    require(companyId: string, feature: PlanFeatureKey): Promise<void>;
}

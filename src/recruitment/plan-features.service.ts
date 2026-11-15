import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type PlanFeatureKey =
  | 'sourcing_agent'
  | 'pstn_outbound'
  | 'calendar_sync'
  | 'multi_round';

const DEFAULT_FEATURES: Record<PlanFeatureKey, boolean> = {
  sourcing_agent: true,
  pstn_outbound: true,
  calendar_sync: true,
  multi_round: true,
};

@Injectable()
export class PlanFeaturesService {
  constructor(private readonly prisma: PrismaService) {}

  async featuresForCompany(companyId: string): Promise<Record<PlanFeatureKey, boolean>> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    });
    const raw = (company?.plan.features ?? {}) as Record<string, boolean>;
    return {
      sourcing_agent: raw.sourcing_agent ?? DEFAULT_FEATURES.sourcing_agent,
      pstn_outbound: raw.pstn_outbound ?? DEFAULT_FEATURES.pstn_outbound,
      calendar_sync: raw.calendar_sync ?? DEFAULT_FEATURES.calendar_sync,
      multi_round: raw.multi_round ?? DEFAULT_FEATURES.multi_round,
    };
  }

  async require(companyId: string, feature: PlanFeatureKey): Promise<void> {
    const f = await this.featuresForCompany(companyId);
    if (!f[feature]) {
      throw new ForbiddenException(`Plan does not include feature: ${feature}`);
    }
  }
}

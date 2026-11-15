import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompany(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      include: {
        plan: true,
        usage: {
          orderBy: { periodStart: 'desc' },
          take: 1,
        },
      },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  updateBranding(companyId: string, dto: UpdateTenantDto) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: dto,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        timezone: true,
        plan: { select: { id: true, name: true, interviewsPerMonth: true } },
      },
    });
  }
}

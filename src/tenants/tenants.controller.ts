import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { StaffGuard } from '../auth/guards/staff.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(StaffGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Current company, plan, and usage' })
  current(@TenantId() companyId: string) {
    return this.tenants.getCompany(companyId);
  }

  @Patch('current/branding')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update tenant branding' })
  branding(@TenantId() companyId: string, @Body() dto: UpdateTenantDto) {
    return this.tenants.updateBranding(companyId, dto);
  }
}

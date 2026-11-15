import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StaffGuard } from '../auth/guards/staff.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(StaffGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Current staff profile + tenant branding' })
  me(@CurrentUser() user: JwtPayload) {
    return this.users.getMe(user.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'List company users' })
  list(@TenantId() companyId: string) {
    return this.users.list(companyId);
  }

  @Post('invite')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Invite a staff user' })
  invite(@TenantId() companyId: string, @Body() dto: CreateUserDto) {
    return this.users.invite(companyId, dto);
  }
}

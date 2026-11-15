import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    if (!user || user.aud !== 'staff') {
      throw new ForbiddenException('Staff access required');
    }
    if (user.role === UserRole.ADMIN) {
      return true;
    }
    if (!requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class StaffGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (!user) {
      return true;
    }
    if (user.aud !== 'staff') {
      throw new ForbiddenException('Staff access required');
    }
    return true;
  }
}

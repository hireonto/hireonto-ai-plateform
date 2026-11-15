import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: JwtPayload;
      params: Record<string, string>;
      query: Record<string, string>;
      headers: Record<string, string>;
      tenantId?: string;
    }>();

    if (!request.user) {
      return true;
    }

    const headerTenant =
      request.headers['x-company-id'] ?? request.headers['x-tenant-id'];
    const paramTenant = request.params.companyId;
    const queryTenant = request.query.companyId as string | undefined;

    const requestedTenant = headerTenant ?? paramTenant ?? queryTenant;
    const tenantId = request.user.companyId;

    if (requestedTenant && requestedTenant !== tenantId) {
      throw new ForbiddenException('Tenant mismatch');
    }

    request.tenantId = tenantId;
    return true;
  }
}

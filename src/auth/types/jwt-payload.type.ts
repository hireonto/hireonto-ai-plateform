import { UserRole } from '@prisma/client';

export type JwtAudience = 'staff' | 'candidate';

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  role: UserRole | 'CANDIDATE';
  aud: JwtAudience;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

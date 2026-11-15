import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokens, JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async staffLogin(email: string, password: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
    if (!user?.passwordHash || user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return this.issueStaffTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh' || payload.aud !== 'staff') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Session expired');
    }
    const hash = this.hashToken(refreshToken);
    if (hash !== user.refreshTokenHash) {
      throw new UnauthorizedException('Session expired');
    }
    return this.issueStaffTokens(user);
  }

  async acceptInvite(token: string, password: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findFirst({
      where: {
        inviteToken: token,
        inviteExpiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired invite');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: UserStatus.ACTIVE,
        inviteToken: null,
        inviteExpiresAt: null,
      },
    });
    return this.issueStaffTokens(updated);
  }

  async requestPasswordReset(email: string): Promise<{ sent: boolean }> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
    if (!user) {
      return { sent: true };
    }
    const token = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const appUrl = this.config.get<string>('appUrl') ?? 'http://localhost:3000';
    await this.notifications.sendPasswordReset({
      companyId: user.companyId,
      to: user.email,
      resetUrl: `${appUrl}/reset-password?token=${token}`,
    });
    return { sent: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetExpiresAt: null,
        refreshTokenHash: null,
      },
    });
  }

  async candidateMagicLink(
    email: string,
    interviewToken?: string,
  ): Promise<{ sent: boolean }> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
    if (!candidate) {
      return { sent: true };
    }
    if (interviewToken) {
      const interview = await this.prisma.interview.findFirst({
        where: { accessToken: interviewToken, candidateId: candidate.id },
      });
      if (!interview) {
        return { sent: true };
      }
    }
    const token = randomBytes(32).toString('hex');
    await this.prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        magicLinkToken: token,
        magicLinkExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    return { sent: true };
  }

  async candidateLogin(
    token: string,
    tempPassword?: string,
  ): Promise<AuthTokens> {
    const candidate = await this.prisma.candidate.findFirst({
      where: {
        magicLinkToken: token,
        magicLinkExpiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });
    if (!candidate) {
      throw new UnauthorizedException('Invalid or expired link');
    }
    if (candidate.tempPasswordHash) {
      if (!tempPassword) {
        throw new UnauthorizedException('Temporary password required');
      }
      const valid = await bcrypt.compare(
        tempPassword,
        candidate.tempPasswordHash,
      );
      if (!valid) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }
    await this.prisma.candidate.update({
      where: { id: candidate.id },
      data: { magicLinkToken: null, magicLinkExpiresAt: null },
    });
    return this.issueCandidateTokens(candidate);
  }

  async candidateInterviewPreview(accessToken: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { accessToken, deletedAt: null },
      include: {
        job: { select: { title: true } },
        company: {
          select: { name: true, logoUrl: true, primaryColor: true, secondaryColor: true },
        },
      },
    });
    if (!interview) {
      throw new BadRequestException('Invalid interview link');
    }
    return {
      status: interview.status,
      windowEnd: interview.windowEnd,
      jobTitle: interview.job.title,
      company: interview.company,
    };
  }

  async candidateInterviewLogin(accessToken: string, tempPassword: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { accessToken, deletedAt: null },
      include: { candidate: true },
    });
    const hash = interview?.candidate.tempPasswordHash;
    if (!interview || !hash || interview.candidate.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(tempPassword, hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.issueCandidateTokens(interview.candidate);
    return { ...tokens, interviewId: interview.id };
  }

  private async issueStaffTokens(user: {
    id: string;
    email: string;
    companyId: string;
    role: UserRole;
  }): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      aud: 'staff',
      type: 'access',
    };
    const refreshPayload: JwtPayload = { ...accessPayload, type: 'refresh' };
    const accessTtl = this.config.get<string>('jwt.accessTtl') ?? '15m';
    const refreshTtl = this.config.get<string>('jwt.refreshTtl') ?? '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: accessTtl,
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: refreshTtl,
      }),
    ]);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: this.hashToken(refreshToken) },
    });

    return { accessToken, refreshToken, expiresIn: accessTtl };
  }

  private async issueCandidateTokens(candidate: {
    id: string;
    email: string | null;
    companyId: string;
  }): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      sub: candidate.id,
      email: candidate.email ?? '',
      companyId: candidate.companyId,
      role: 'CANDIDATE',
      aud: 'candidate',
      type: 'access',
    };
    const refreshPayload: JwtPayload = { ...accessPayload, type: 'refresh' };
    const accessTtl = this.config.get<string>('jwt.accessTtl') ?? '15m';
    const refreshTtl = '24h';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: accessTtl,
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: refreshTtl,
      }),
    ]);

    return { accessToken, refreshToken, expiresIn: accessTtl };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

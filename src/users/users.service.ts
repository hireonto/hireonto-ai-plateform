import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  list(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async invite(companyId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { companyId, email: dto.email.toLowerCase(), deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('User already exists');
    }
    const inviteToken = randomBytes(32).toString('hex');
    const user = await this.prisma.user.create({
      data: {
        companyId,
        email: dto.email.toLowerCase(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        status: UserStatus.INVITED,
        inviteToken,
        inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        inviteToken: true,
        company: { select: { name: true } },
      },
    });
    const appUrl = this.config.get<string>('appUrl') ?? 'http://localhost:3000';
    await this.notifications.sendStaffInvite({
      companyId,
      to: user.email,
      companyName: user.company.name,
      role: user.role,
      acceptUrl: `${appUrl}/accept-invite?token=${inviteToken}`,
    });
    const { company, ...rest } = user;
    void company;
    return rest;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
            timezone: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash, refreshTokenHash, resetToken, inviteToken, ...safe } =
      user;
    void passwordHash;
    void refreshTokenHash;
    void resetToken;
    void inviteToken;
    return safe;
  }
}

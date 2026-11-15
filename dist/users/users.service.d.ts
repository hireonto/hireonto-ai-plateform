import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private readonly prisma;
    private readonly notifications;
    private readonly config;
    constructor(prisma: PrismaService, notifications: NotificationsService, config: ConfigService);
    list(companyId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        lastLoginAt: Date | null;
    }[]>;
    invite(companyId: string, dto: CreateUserDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        inviteToken: string | null;
    }>;
    getMe(userId: string): Promise<{
        company: {
            id: string;
            name: string;
            timezone: string;
            slug: string;
            logoUrl: string | null;
            primaryColor: string | null;
            secondaryColor: string | null;
        };
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        companyId: string;
        updatedAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        googleId: string | null;
        inviteExpiresAt: Date | null;
        resetExpiresAt: Date | null;
        lastLoginAt: Date | null;
        deletedAt: Date | null;
    }>;
}

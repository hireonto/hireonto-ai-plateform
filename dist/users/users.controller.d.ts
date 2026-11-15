import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    me(user: JwtPayload): Promise<{
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
}

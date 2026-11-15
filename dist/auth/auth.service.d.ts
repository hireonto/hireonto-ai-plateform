import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokens } from './types/jwt-payload.type';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly notifications;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, notifications: NotificationsService);
    staffLogin(email: string, password: string): Promise<AuthTokens>;
    refresh(refreshToken: string): Promise<AuthTokens>;
    acceptInvite(token: string, password: string): Promise<AuthTokens>;
    requestPasswordReset(email: string): Promise<{
        sent: boolean;
    }>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    candidateMagicLink(email: string, interviewToken?: string): Promise<{
        sent: boolean;
    }>;
    candidateLogin(token: string, tempPassword?: string): Promise<AuthTokens>;
    candidateInterviewPreview(accessToken: string): Promise<{
        status: import(".prisma/client").$Enums.InterviewStatus;
        windowEnd: Date;
        jobTitle: string;
        company: {
            name: string;
            logoUrl: string | null;
            primaryColor: string | null;
            secondaryColor: string | null;
        };
    }>;
    candidateInterviewLogin(accessToken: string, tempPassword: string): Promise<{
        interviewId: string;
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    }>;
    private issueStaffTokens;
    private issueCandidateTokens;
    private hashToken;
}

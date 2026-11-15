import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
export declare class NotificationsService {
    private readonly prisma;
    private readonly email;
    constructor(prisma: PrismaService, email: EmailService);
    notifyInApp(companyId: string, userId: string, title: string, body: string, metadata?: Record<string, unknown>): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.NotificationStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        companyId: string;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        title: string;
        body: string;
        readAt: Date | null;
        updatedAt: Date;
        userId: string | null;
    }>;
    sendCandidateInvite(params: {
        companyId: string;
        to: string;
        companyName: string;
        loginUrl: string;
        tempPassword?: string;
        deadlineIso: string;
        primaryColor: string;
    }): Promise<{
        id: string;
        sent: boolean;
    }>;
    sendInterviewReminder(params: {
        companyId: string;
        to: string;
        companyName: string;
        hoursLeft: number;
        loginUrl: string;
    }): Promise<{
        id: string;
        sent: boolean;
    }>;
    sendPasswordReset(params: {
        companyId: string;
        to: string;
        resetUrl: string;
    }): Promise<{
        id: string;
        sent: boolean;
    }>;
    sendStaffInvite(params: {
        companyId: string;
        to: string;
        companyName: string;
        role: string;
        acceptUrl: string;
    }): Promise<{
        id: string;
        sent: boolean;
    }>;
}

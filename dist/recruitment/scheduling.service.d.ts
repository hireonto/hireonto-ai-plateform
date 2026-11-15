import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { CalendarService } from './calendar.service';
import { PlanFeaturesService } from './plan-features.service';
import { PstnService } from './pstn.service';
export declare class SchedulingService {
    private readonly prisma;
    private readonly planFeatures;
    private readonly email;
    private readonly calendar;
    private readonly config;
    private readonly pstn;
    constructor(prisma: PrismaService, planFeatures: PlanFeaturesService, email: EmailService, calendar: CalendarService, config: ConfigService, pstn: PstnService);
    startCallCampaign(companyId: string, jobId: string, createdById: string, candidateJobIds: string[], promptTemplate: string): Promise<{
        campaignId: string;
        calls: number;
        twilio: number;
        simulated: number;
    }>;
    private simulateOutboundCall;
    confirmSchedule(companyId: string, candidateJobId: string, jobId: string, scheduledAt: Date, emailTo?: string | null): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.InterviewScheduleStatus;
        createdAt: Date;
        companyId: string;
        updatedAt: Date;
        timezone: string;
        jobId: string;
        accessToken: string | null;
        jobRoundId: string | null;
        meetProvider: import(".prisma/client").$Enums.MeetProvider;
        candidateJobId: string;
        scheduledAt: Date;
        meetUrl: string | null;
        calendarEventId: string | null;
        confirmationSentAt: Date | null;
    }>;
    maybeCompleteCampaignForCall(callId: string): Promise<void>;
}

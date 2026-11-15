import { ConfigService } from '@nestjs/config';
import { MeetProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class CalendarService {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService);
    createInterviewEvent(companyId: string, input: {
        title: string;
        scheduledAt: Date;
        attendeeEmail?: string;
    }): Promise<{
        provider: MeetProvider;
        url: string;
        eventId: string;
    }>;
    private googleAccessToken;
    private createGoogleEvent;
    private microsoftAccessToken;
    private createMicrosoftEvent;
}

import { ConfigService } from '@nestjs/config';
import { EmailService } from '../notifications/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { CalendarService } from './calendar.service';
import { RoundsService } from './rounds.service';
export declare class RoundAdvanceService {
    private readonly prisma;
    private readonly rounds;
    private readonly calendar;
    private readonly email;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, rounds: RoundsService, calendar: CalendarService, email: EmailService, config: ConfigService);
    afterInterviewCompleted(interviewId: string): Promise<void>;
}

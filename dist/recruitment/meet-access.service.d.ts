import { PrismaService } from '../prisma/prisma.service';
export declare class MeetAccessService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getByToken(accessToken: string): Promise<{
        scheduledAt: Date;
        meetUrl: string | null;
        meetProvider: import(".prisma/client").$Enums.MeetProvider;
        jobTitle: string;
        roundLabel: string;
        company: {
            name: string;
            logoUrl: string | null;
            primaryColor: string | null;
            secondaryColor: string | null;
        };
    }>;
}

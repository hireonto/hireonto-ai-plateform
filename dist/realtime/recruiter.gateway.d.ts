import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
export declare class RecruiterGateway implements OnGatewayConnection {
    private readonly jwt;
    private readonly config;
    private readonly prisma;
    server: Server;
    private readonly logger;
    constructor(jwt: JwtService, config: ConfigService, prisma: PrismaService);
    handleConnection(client: Socket): Promise<void>;
    watch(client: Socket, body: {
        interviewId: string;
    }): Promise<{
        error: string;
        watching?: undefined;
    } | {
        watching: string;
        error?: undefined;
    }>;
    dashboard(client: Socket): Promise<{
        counts: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.InterviewGroupByOutputType, "status"[]> & {
            _count: number;
        })[];
    }>;
    emitLiveTranscript(interviewId: string, segment: {
        text: string;
        answerId: string;
    }): void;
    emitCompanyCounter(companyId: string, payload: Record<string, unknown>): void;
}

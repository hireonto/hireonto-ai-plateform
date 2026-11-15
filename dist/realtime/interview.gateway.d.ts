import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ProctoringService } from '../proctoring/proctoring.service';
import { SessionsService } from '../sessions/sessions.service';
export declare class InterviewGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwt;
    private readonly config;
    private readonly proctoring;
    private readonly sessions;
    server: Server;
    private readonly logger;
    private heartbeats;
    private interviewBySocket;
    constructor(jwt: JwtService, config: ConfigService, proctoring: ProctoringService, sessions: SessionsService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    onHeartbeat(client: Socket): {
        ok: boolean;
    };
    onProctoring(client: Socket, body: {
        events: Array<{
            eventType: string;
            severity?: string;
            payload?: Record<string, unknown>;
            clientTimestamp?: string;
        }>;
    }): Promise<{
        stored: number;
        strikeCount: number;
        terminated: boolean;
    }>;
    onNext(client: Socket): Promise<{
        done: true;
        question?: undefined;
        interviewEndsAt?: undefined;
    } | {
        done: false;
        question: {
            id: string;
            orderIndex: number;
            questionText: string;
            questionType: string;
            timeLimitSec: number | null;
        };
        interviewEndsAt: Date;
    }>;
    private resetHeartbeat;
    private onMissedHeartbeat;
}

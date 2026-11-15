import { JwtPayload } from '../auth/types/jwt-payload.type';
import { SessionsService } from './sessions.service';
export declare class SessionsController {
    private readonly sessions;
    constructor(sessions: SessionsService);
    private candidateId;
    start(interviewId: string, user: JwtPayload): Promise<{
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
    next(interviewId: string, user: JwtPayload): Promise<{
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
    answer(interviewId: string, questionId: string, user: JwtPayload, body: {
        text?: string;
        transcript?: string;
        code?: string;
        audioUrl?: string;
    }): Promise<{
        answerId: string;
    }>;
    followUp(interviewId: string, questionId: string, user: JwtPayload): Promise<{
        question: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            interviewId: string;
            orderIndex: number;
            questionText: string;
            questionType: string;
            timeLimitSec: number | null;
            isFollowUp: boolean;
            parentQuestionId: string | null;
        };
    }>;
    reconnect(interviewId: string, user: JwtPayload): Promise<{
        reconnected: boolean;
        next: {
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
        };
    }>;
    finish(interviewId: string, user: JwtPayload): Promise<{
        completed: boolean;
    }>;
    sttToken(interviewId: string, user: JwtPayload): Promise<{
        token: string;
        wsUrl: string;
        expiresIn: number;
    }>;
}

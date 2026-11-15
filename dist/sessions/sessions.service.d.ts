import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RoundAdvanceService } from '../recruitment/round-advance.service';
export declare class SessionsService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly roundAdvance;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, roundAdvance: RoundAdvanceService);
    start(interviewId: string, candidateId: string): Promise<{
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
    nextQuestion(interviewId: string, candidateId: string): Promise<{
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
    submitAnswer(interviewId: string, candidateId: string, questionId: string, body: {
        text?: string;
        transcript?: string;
        code?: string;
        audioUrl?: string;
    }): Promise<{
        answerId: string;
    }>;
    requestFollowUp(interviewId: string, candidateId: string, questionId: string): Promise<{
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
    reconnect(interviewId: string, candidateId: string): Promise<{
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
    finish(interviewId: string, candidateId: string): Promise<{
        completed: boolean;
    }>;
    sttToken(interviewId: string, candidateId: string): Promise<{
        token: string;
        wsUrl: string;
        expiresIn: number;
    }>;
    private getCandidateInterview;
    private assertWindowOpen;
    private assertInProgress;
    private assertWithinTimeLimit;
    private fakeQuestions;
}

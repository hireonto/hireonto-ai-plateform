import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { ConversationService } from './conversation.service';
declare class ChatMessageDto {
    message: string;
}
declare class AgentTurnDto {
    role: 'interviewer' | 'candidate';
    text: string;
}
declare class AgentProctoringDto {
    eventType: string;
    severity: string;
    detail: string;
}
declare class AgentCompleteDto {
    reason: string;
}
export declare class ConversationController {
    private readonly conversation;
    constructor(conversation: ConversationService);
    start(interviewId: string, user: JwtPayload): Promise<import("./conversation.service").ConversationStart>;
    ensureAgent(interviewId: string, user: JwtPayload): Promise<{
        dispatched: boolean;
        roomName: string;
    }>;
    chat(interviewId: string, user: JwtPayload, dto: ChatMessageDto): Promise<{
        reply: string;
        done: boolean;
    }>;
}
export declare class TranscriptController {
    private readonly conversation;
    constructor(conversation: ConversationService);
    plan(companyId: string, interviewId: string): Promise<import("../ai-client/ai-client.service").PlannedQuestion[]>;
    transcript(companyId: string, interviewId: string): Promise<import("../ai-client/ai-client.service").ConversationTurn[]>;
}
export declare class InternalServiceGuard implements CanActivate {
    private readonly jwt;
    private readonly config;
    constructor(jwt: JwtService, config: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class InternalInterviewController {
    private readonly conversation;
    constructor(conversation: ConversationService);
    context(interviewId: string): Promise<import("../ai-client/ai-client.service").InterviewContext>;
    turn(interviewId: string, dto: AgentTurnDto): Promise<{
        ok: boolean;
    }>;
    proctoring(interviewId: string, dto: AgentProctoringDto): Promise<{
        stored: number;
        strikeCount: number;
        terminated: boolean;
    }>;
    complete(interviewId: string, dto: AgentCompleteDto): Promise<{
        completed: boolean;
        status: "PENDING" | "INVITED" | "COMPLETED" | "EXPIRED" | "CANCELLED" | "TERMINATED";
    } | {
        completed: boolean;
        status?: undefined;
    }>;
}
export {};

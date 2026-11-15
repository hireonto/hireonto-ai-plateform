import { PrismaService } from '../prisma/prisma.service';
import { ConversationTurn, InterviewContext, PlannedQuestion } from './ai-client.service';
export declare class InterviewContextService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    context(interviewId: string): Promise<InterviewContext>;
    plan(interviewId: string): Promise<PlannedQuestion[]>;
    transcript(interviewId: string): Promise<ConversationTurn[]>;
}

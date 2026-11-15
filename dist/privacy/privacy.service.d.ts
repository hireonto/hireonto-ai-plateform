import { Queue } from 'bullmq';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { RetentionJobData } from './privacy.constants';
export declare class PrivacyService {
    private readonly prisma;
    private readonly audit;
    private readonly queue;
    constructor(prisma: PrismaService, audit: AuditService, queue: Queue<RetentionJobData>);
    scheduleRetention(companyId: string, recordingRetentionDays: number): Promise<import("bullmq").Job<RetentionJobData, any, string>>;
    exportCandidate(companyId: string, candidateId: string, actorId: string): Promise<{
        resumes: {
            id: string;
            createdAt: Date;
            companyId: string;
            updatedAt: Date;
            deletedAt: Date | null;
            candidateId: string;
            fileName: string;
            storageKey: string;
            mimeType: string | null;
            parseStatus: string;
            parsedText: string | null;
        }[];
        candidateJobs: {
            id: string;
            status: import(".prisma/client").$Enums.CandidateJobStatus;
            createdAt: Date;
            companyId: string;
            updatedAt: Date;
            deletedAt: Date | null;
            jobId: string;
            candidateId: string;
            fitScore: number | null;
            fitExplanation: string | null;
            shortlistedAt: Date | null;
            rejectedAt: Date | null;
            holdAt: Date | null;
            history: import("@prisma/client/runtime/library").JsonValue;
            currentRoundIndex: number;
        }[];
        interviews: ({
            integrityReport: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                summary: import("@prisma/client/runtime/library").JsonValue;
                interviewId: string;
                riskScore: number | null;
                flags: import("@prisma/client/runtime/library").JsonValue;
            } | null;
            evaluationReport: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                summary: string | null;
                interviewId: string;
                overallScore: number | null;
                recommendation: string | null;
                details: import("@prisma/client/runtime/library").JsonValue;
                humanOverride: import("@prisma/client/runtime/library").JsonValue | null;
                finalDecision: string | null;
            } | null;
            questions: ({
                answers: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    text: string | null;
                    score: number | null;
                    interviewQuestionId: string;
                    transcript: string | null;
                    code: string | null;
                    audioUrl: string | null;
                    aiReasoning: string | null;
                    overrideScore: number | null;
                    submittedAt: Date | null;
                }[];
            } & {
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
            })[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.InterviewStatus;
            createdAt: Date;
            companyId: string;
            updatedAt: Date;
            deletedAt: Date | null;
            jobId: string;
            candidateId: string;
            windowStart: Date;
            windowEnd: Date;
            startedAt: Date | null;
            finishedAt: Date | null;
            reconnectUsedAt: Date | null;
            strikeCount: number;
            accessToken: string | null;
            jobRoundId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        updatedAt: Date;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        deletedAt: Date | null;
        phone: string | null;
        timezone: string | null;
        tempPasswordHash: string | null;
        magicLinkToken: string | null;
        magicLinkExpiresAt: Date | null;
        tags: string[];
        notes: string | null;
    }>;
    deleteCandidate(companyId: string, candidateId: string, actorId: string): Promise<{
        deleted: boolean;
    }>;
}

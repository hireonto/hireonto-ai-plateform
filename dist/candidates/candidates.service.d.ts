import { Queue } from 'bullmq';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { JobsService } from '../jobs/jobs.service';
import { BulkResumeItemDto } from './dto/bulk-upload.dto';
export declare class CandidatesService {
    private readonly prisma;
    private readonly storage;
    private readonly jobs;
    private readonly audit;
    private readonly parseQueue;
    constructor(prisma: PrismaService, storage: StorageService, jobs: JobsService, audit: AuditService, parseQueue: Queue);
    getProfileAudited(companyId: string, candidateId: string, actorId: string): Promise<{
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
        candidateJobs: ({
            job: {
                id: string;
                title: string;
            };
        } & {
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
    listForJob(companyId: string, jobId: string): import(".prisma/client").Prisma.PrismaPromise<({
        candidate: {
            id: string;
            email: string | null;
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            tags: string[];
        };
    } & {
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
    })[]>;
    getProfile(companyId: string, candidateId: string): Promise<{
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
        candidateJobs: ({
            job: {
                id: string;
                title: string;
            };
        } & {
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
    bulkPresign(companyId: string, jobId: string, files: BulkResumeItemDto[]): Promise<{
        uploads: {
            url: string;
            key: string;
            bucket: string;
            expiresIn: number;
            candidateId: string;
            resumeId: string;
        }[];
    }>;
    confirmBulkUpload(companyId: string, jobId: string, resumeIds: string[]): Promise<{
        enqueued: string[];
    }>;
    createFromTextResume(companyId: string, input: {
        jobId: string;
        fileName: string;
        resumeText: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
    }): Promise<{
        candidateId: string;
        resumeId: string;
    }>;
    updateTags(companyId: string, candidateId: string, tags: string[]): Promise<{
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
    updateNotes(companyId: string, candidateId: string, notes: string): Promise<{
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
    private findExistingCandidate;
}

import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CandidatesService } from './candidates.service';
import { BulkResumeUploadDto, ConfirmBulkUploadDto } from './dto/bulk-upload.dto';
export declare class CandidatesController {
    private readonly candidates;
    constructor(candidates: CandidatesService);
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
    profile(companyId: string, candidateId: string, user: JwtPayload): Promise<{
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
    bulkPresign(companyId: string, jobId: string, dto: BulkResumeUploadDto): Promise<{
        uploads: {
            url: string;
            key: string;
            bucket: string;
            expiresIn: number;
            candidateId: string;
            resumeId: string;
        }[];
    }>;
    bulkConfirm(companyId: string, jobId: string, dto: ConfirmBulkUploadDto): Promise<{
        enqueued: string[];
    }>;
    tags(companyId: string, candidateId: string, body: {
        tags: string[];
    }): Promise<{
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
    notes(companyId: string, candidateId: string, body: {
        notes: string;
    }): Promise<{
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
}

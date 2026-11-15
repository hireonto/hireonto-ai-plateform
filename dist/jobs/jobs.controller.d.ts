import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateJobDto, JobInterviewConfigDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JdPresignDto, QuestionBankPresignDto } from './dto/upload-presign.dto';
import { JobsService } from './jobs.service';
export declare class JobsController {
    private readonly jobs;
    constructor(jobs: JobsService);
    list(companyId: string): import(".prisma/client").Prisma.PrismaPromise<({
        interviewConfig: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            jobId: string;
            durationMinutes: number;
            windowHours: number;
            maxFollowUps: number;
            codingEnabled: boolean;
            proctoringEnabled: boolean;
            questionCount: number;
            config: import("@prisma/client/runtime/library").JsonValue;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        title: string;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        jdStorageKey: string | null;
        location: string | null;
        isActive: boolean;
        autoShortlistThreshold: number | null;
        createdById: string | null;
    })[]>;
    create(companyId: string, user: JwtPayload, dto: CreateJobDto): import(".prisma/client").Prisma.Prisma__JobClient<{
        interviewConfig: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            jobId: string;
            durationMinutes: number;
            windowHours: number;
            maxFollowUps: number;
            codingEnabled: boolean;
            proctoringEnabled: boolean;
            questionCount: number;
            config: import("@prisma/client/runtime/library").JsonValue;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        title: string;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        jdStorageKey: string | null;
        location: string | null;
        isActive: boolean;
        autoShortlistThreshold: number | null;
        createdById: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    get(companyId: string, jobId: string): Promise<{
        interviewConfig: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            jobId: string;
            durationMinutes: number;
            windowHours: number;
            maxFollowUps: number;
            codingEnabled: boolean;
            proctoringEnabled: boolean;
            questionCount: number;
            config: import("@prisma/client/runtime/library").JsonValue;
        } | null;
        questionBanks: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            jobId: string;
            fileName: string;
            storageKey: string;
            parsedAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        title: string;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        jdStorageKey: string | null;
        location: string | null;
        isActive: boolean;
        autoShortlistThreshold: number | null;
        createdById: string | null;
    }>;
    update(companyId: string, jobId: string, dto: UpdateJobDto): Promise<{
        interviewConfig: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            jobId: string;
            durationMinutes: number;
            windowHours: number;
            maxFollowUps: number;
            codingEnabled: boolean;
            proctoringEnabled: boolean;
            questionCount: number;
            config: import("@prisma/client/runtime/library").JsonValue;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        title: string;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        jdStorageKey: string | null;
        location: string | null;
        isActive: boolean;
        autoShortlistThreshold: number | null;
        createdById: string | null;
    }>;
    interviewConfig(companyId: string, jobId: string, dto: JobInterviewConfigDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        jobId: string;
        durationMinutes: number;
        windowHours: number;
        maxFollowUps: number;
        codingEnabled: boolean;
        proctoringEnabled: boolean;
        questionCount: number;
        config: import("@prisma/client/runtime/library").JsonValue;
    }>;
    presignJd(companyId: string, jobId: string, dto: JdPresignDto): Promise<{
        url: string;
        key: string;
        bucket: string;
        expiresIn: number;
    }>;
    presignQuestionBank(companyId: string, jobId: string, dto: QuestionBankPresignDto): Promise<{
        documentId: string;
        url: string;
        key: string;
        bucket: string;
        expiresIn: number;
    }>;
}

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateJobDto, JobInterviewConfigDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
export declare class JobsService {
    private readonly prisma;
    private readonly storage;
    constructor(prisma: PrismaService, storage: StorageService);
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
    create(companyId: string, dto: CreateJobDto, createdById?: string): import(".prisma/client").Prisma.Prisma__JobClient<{
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
    upsertInterviewConfig(companyId: string, jobId: string, dto: JobInterviewConfigDto): Promise<{
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
    presignJd(companyId: string, jobId: string, fileName: string, contentType: string): Promise<{
        url: string;
        key: string;
        bucket: string;
        expiresIn: number;
    }>;
    presignQuestionBank(companyId: string, jobId: string, fileName: string, contentType: string): Promise<{
        documentId: string;
        url: string;
        key: string;
        bucket: string;
        expiresIn: number;
    }>;
}

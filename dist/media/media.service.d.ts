import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
export declare class MediaService {
    private readonly prisma;
    private readonly storage;
    constructor(prisma: PrismaService, storage: StorageService);
    presignChunk(interviewId: string, streamType: 'camera' | 'screen', chunkIndex: number, contentType: string): Promise<{
        chunkIndex: number;
        streamType: "camera" | "screen";
        url: string;
        key: string;
        bucket: string;
        expiresIn: number;
    }>;
    confirmChunk(interviewId: string, streamType: string, chunkIndex: number, storageKey: string, byteSize: number): Promise<{
        id: string;
        interviewId: string;
        storageKey: string;
        chunkIndex: number;
        streamType: string;
        byteSize: number;
        uploadedAt: Date;
    }>;
    presignSnapshot(interviewId: string, contentType: string): Promise<{
        url: string;
        key: string;
        bucket: string;
        expiresIn: number;
    }>;
    saveSnapshot(interviewId: string, storageKey: string, eventType?: string): Promise<{
        id: string;
        interviewId: string;
        storageKey: string;
        eventType: string | null;
        capturedAt: Date;
    }>;
    playbackUrl(companyId: string, interviewId: string, storageKey: string): Promise<{
        url: string;
        expiresIn: number;
    }>;
}

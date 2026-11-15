import { JwtPayload } from '../auth/types/jwt-payload.type';
import { AuditService } from '../common/audit/audit.service';
import { MediaService } from './media.service';
export declare class MediaController {
    private readonly media;
    private readonly audit;
    constructor(media: MediaService, audit: AuditService);
    presignChunk(interviewId: string, body: {
        streamType: 'camera' | 'screen';
        chunkIndex: number;
        contentType: string;
    }): Promise<{
        chunkIndex: number;
        streamType: "camera" | "screen";
        url: string;
        key: string;
        bucket: string;
        expiresIn: number;
    }>;
    confirmChunk(interviewId: string, body: {
        streamType: string;
        chunkIndex: number;
        storageKey: string;
        byteSize: number;
    }): Promise<{
        id: string;
        interviewId: string;
        storageKey: string;
        chunkIndex: number;
        streamType: string;
        byteSize: number;
        uploadedAt: Date;
    }>;
    presignSnapshot(interviewId: string, body: {
        contentType: string;
    }): Promise<{
        url: string;
        key: string;
        bucket: string;
        expiresIn: number;
    }>;
    saveSnapshot(interviewId: string, body: {
        storageKey: string;
        eventType?: string;
    }): Promise<{
        id: string;
        interviewId: string;
        storageKey: string;
        eventType: string | null;
        capturedAt: Date;
    }>;
    playback(companyId: string, interviewId: string, storageKey: string, user: JwtPayload): Promise<{
        url: string;
        expiresIn: number;
    }>;
}

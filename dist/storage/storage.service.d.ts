import { ConfigService } from '@nestjs/config';
export declare class StorageService {
    private readonly config;
    private readonly client;
    private readonly bucket;
    constructor(config: ConfigService);
    resumeKey(companyId: string, fileName: string): string;
    jdKey(companyId: string, jobId: string, fileName: string): string;
    questionBankKey(companyId: string, jobId: string, fileName: string): string;
    presignedPut(key: string, contentType: string, expiresSec?: number): Promise<{
        url: string;
        key: string;
        bucket: string;
        expiresIn: number;
    }>;
    presignedGet(key: string, expiresSec?: number): Promise<string>;
    createMultipartUpload(key: string, contentType: string): Promise<{
        uploadId: string | undefined;
        key: string;
        bucket: string;
    }>;
}

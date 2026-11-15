export declare class BulkResumeItemDto {
    fileName: string;
    contentType: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
}
export declare class BulkResumeUploadDto {
    files: BulkResumeItemDto[];
}
export declare class ConfirmBulkUploadDto {
    resumeIds: string[];
}

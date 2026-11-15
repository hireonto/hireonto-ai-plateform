export declare class CreateJobDto {
    title: string;
    description?: string;
    location?: string;
    autoShortlistThreshold?: number;
}
export declare class JobInterviewConfigDto {
    durationMinutes?: number;
    windowHours?: number;
    proctoringEnabled?: boolean;
    codingEnabled?: boolean;
    questionCount?: number;
}

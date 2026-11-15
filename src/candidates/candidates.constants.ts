export const RESUME_PARSE_QUEUE = 'resume-parse';

export interface ResumeParseJobData {
  companyId: string;
  jobId: string;
  candidateId: string;
  resumeId: string;
  storageKey: string;
}

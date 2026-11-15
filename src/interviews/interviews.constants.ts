export const INTERVIEW_JOBS_QUEUE = 'interview-jobs';

export type InterviewScheduledJob =
  | { type: 'reminder'; interviewId: string; hoursLeft: 24 | 4 }
  | { type: 'expire'; interviewId: string };

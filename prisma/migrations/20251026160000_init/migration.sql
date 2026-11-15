-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'RECRUITER', 'INTERVIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- CreateEnum
CREATE TYPE "CandidateJobStatus" AS ENUM ('APPLIED', 'PARSING', 'PARSED', 'SHORTLISTED', 'REJECTED', 'ON_HOLD', 'INTERVIEW_SCHEDULED', 'INTERVIEW_IN_PROGRESS', 'INTERVIEW_COMPLETED', 'HIRED');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('PENDING', 'INVITED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "CodeSubmissionStatus" AS ENUM ('PENDING', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT', 'RUNTIME_ERROR', 'COMPILE_ERROR');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('VIEW', 'DOWNLOAD', 'CREATE', 'UPDATE', 'DELETE', 'DECISION', 'LOGIN', 'EXPORT');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "interviewsPerMonth" INTEGER NOT NULL DEFAULT 50,
    "maxActiveJobs" INTEGER NOT NULL DEFAULT 10,
    "maxUsers" INTEGER NOT NULL DEFAULT 25,
    "features" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#2563eb',
    "secondaryColor" TEXT DEFAULT '#1e40af',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "interviewsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'RECRUITER',
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "googleId" TEXT,
    "refreshTokenHash" TEXT,
    "inviteToken" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetExpiresAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "jdStorageKey" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoShortlistThreshold" DOUBLE PRECISION DEFAULT 0.7,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobInterviewConfig" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "windowHours" INTEGER NOT NULL DEFAULT 72,
    "maxFollowUps" INTEGER NOT NULL DEFAULT 2,
    "codingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "proctoringEnabled" BOOLEAN NOT NULL DEFAULT true,
    "questionCount" INTEGER NOT NULL DEFAULT 5,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobInterviewConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBankDoc" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "parsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "QuestionBankDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "timezone" TEXT,
    "tempPasswordHash" TEXT,
    "magicLinkToken" TEXT,
    "magicLinkExpiresAt" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateJob" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "CandidateJobStatus" NOT NULL DEFAULT 'APPLIED',
    "fitScore" DOUBLE PRECISION,
    "fitExplanation" TEXT,
    "shortlistedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "holdAt" TIMESTAMP(3),
    "history" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CandidateJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "parseStatus" TEXT NOT NULL DEFAULT 'pending',
    "parsedText" TEXT,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'PENDING',
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "reconnectUsedAt" TIMESTAMP(3),
    "strikeCount" INTEGER NOT NULL DEFAULT 0,
    "accessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewQuestion" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT 'behavioral',
    "timeLimitSec" INTEGER,
    "isFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "parentQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "interviewQuestionId" TEXT NOT NULL,
    "text" TEXT,
    "transcript" TEXT,
    "code" TEXT,
    "audioUrl" TEXT,
    "score" DOUBLE PRECISION,
    "aiReasoning" TEXT,
    "overrideScore" DOUBLE PRECISION,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeSubmission" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "languageId" INTEGER NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "stdin" TEXT,
    "stdout" TEXT,
    "stderr" TEXT,
    "status" "CodeSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "judge0Token" TEXT,
    "isHiddenTest" BOOLEAN NOT NULL DEFAULT false,
    "passedTests" INTEGER,
    "totalTests" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptSegment" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "segmentIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "startMs" INTEGER,
    "endMs" INTEGER,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaChunk" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "streamType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProctoringEvent" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "clientTimestamp" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProctoringEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrityReport" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "summary" JSONB NOT NULL DEFAULT '{}',
    "riskScore" DOUBLE PRECISION,
    "flags" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationReport" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION,
    "recommendation" TEXT,
    "summary" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "humanOverride" JSONB,
    "finalDecision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "guestLinkId" TEXT,
    "score" DOUBLE PRECISION,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestLink" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "providerId" TEXT,
    "error" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRun" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "interviewId" TEXT,
    "operation" TEXT NOT NULL,
    "status" "AiRunStatus" NOT NULL DEFAULT 'PENDING',
    "requestPayload" JSONB NOT NULL DEFAULT '{}',
    "responseSummary" JSONB,
    "error" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "source" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_planId_idx" ON "Company"("planId");

-- CreateIndex
CREATE INDEX "Company_deletedAt_idx" ON "Company"("deletedAt");

-- CreateIndex
CREATE INDEX "Usage_companyId_idx" ON "Usage"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Usage_companyId_periodStart_key" ON "Usage"("companyId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteToken_key" ON "User"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE INDEX "User_companyId_role_idx" ON "User"("companyId", "role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_companyId_email_key" ON "User"("companyId", "email");

-- CreateIndex
CREATE INDEX "Job_companyId_isActive_idx" ON "Job"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "Job_deletedAt_idx" ON "Job"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobInterviewConfig_jobId_key" ON "JobInterviewConfig"("jobId");

-- CreateIndex
CREATE INDEX "QuestionBankDoc_jobId_idx" ON "QuestionBankDoc"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_magicLinkToken_key" ON "Candidate"("magicLinkToken");

-- CreateIndex
CREATE INDEX "Candidate_companyId_email_idx" ON "Candidate"("companyId", "email");

-- CreateIndex
CREATE INDEX "Candidate_companyId_phone_idx" ON "Candidate"("companyId", "phone");

-- CreateIndex
CREATE INDEX "Candidate_deletedAt_idx" ON "Candidate"("deletedAt");

-- CreateIndex
CREATE INDEX "CandidateJob_companyId_jobId_status_idx" ON "CandidateJob"("companyId", "jobId", "status");

-- CreateIndex
CREATE INDEX "CandidateJob_companyId_fitScore_idx" ON "CandidateJob"("companyId", "fitScore");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateJob_candidateId_jobId_key" ON "CandidateJob"("candidateId", "jobId");

-- CreateIndex
CREATE INDEX "Resume_companyId_candidateId_idx" ON "Resume"("companyId", "candidateId");

-- CreateIndex
CREATE INDEX "Resume_parseStatus_idx" ON "Resume"("parseStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_accessToken_key" ON "Interview"("accessToken");

-- CreateIndex
CREATE INDEX "Interview_companyId_status_idx" ON "Interview"("companyId", "status");

-- CreateIndex
CREATE INDEX "Interview_companyId_jobId_idx" ON "Interview"("companyId", "jobId");

-- CreateIndex
CREATE INDEX "Interview_windowEnd_idx" ON "Interview"("windowEnd");

-- CreateIndex
CREATE INDEX "Interview_accessToken_idx" ON "Interview"("accessToken");

-- CreateIndex
CREATE INDEX "InterviewQuestion_interviewId_orderIndex_idx" ON "InterviewQuestion"("interviewId", "orderIndex");

-- CreateIndex
CREATE INDEX "Answer_interviewQuestionId_idx" ON "Answer"("interviewQuestionId");

-- CreateIndex
CREATE INDEX "CodeSubmission_answerId_idx" ON "CodeSubmission"("answerId");

-- CreateIndex
CREATE INDEX "TranscriptSegment_answerId_segmentIndex_idx" ON "TranscriptSegment"("answerId", "segmentIndex");

-- CreateIndex
CREATE INDEX "MediaChunk_interviewId_idx" ON "MediaChunk"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaChunk_interviewId_streamType_chunkIndex_key" ON "MediaChunk"("interviewId", "streamType", "chunkIndex");

-- CreateIndex
CREATE INDEX "Snapshot_interviewId_capturedAt_idx" ON "Snapshot"("interviewId", "capturedAt");

-- CreateIndex
CREATE INDEX "ProctoringEvent_interviewId_receivedAt_idx" ON "ProctoringEvent"("interviewId", "receivedAt");

-- CreateIndex
CREATE INDEX "ProctoringEvent_interviewId_eventType_idx" ON "ProctoringEvent"("interviewId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrityReport_interviewId_key" ON "IntegrityReport"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationReport_interviewId_key" ON "EvaluationReport"("interviewId");

-- CreateIndex
CREATE INDEX "Review_interviewId_idx" ON "Review"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestLink_token_key" ON "GuestLink"("token");

-- CreateIndex
CREATE INDEX "GuestLink_companyId_idx" ON "GuestLink"("companyId");

-- CreateIndex
CREATE INDEX "GuestLink_expiresAt_idx" ON "GuestLink"("expiresAt");

-- CreateIndex
CREATE INDEX "Notification_companyId_userId_status_idx" ON "Notification"("companyId", "userId", "status");

-- CreateIndex
CREATE INDEX "EmailLog_companyId_createdAt_idx" ON "EmailLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_template_idx" ON "EmailLog"("template");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_resourceType_resourceId_idx" ON "AuditLog"("companyId", "resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AiRun_companyId_operation_idx" ON "AiRun"("companyId", "operation");

-- CreateIndex
CREATE INDEX "AiRun_interviewId_idx" ON "AiRun"("interviewId");

-- CreateIndex
CREATE INDEX "Webhook_source_eventType_status_idx" ON "Webhook"("source", "eventType", "status");

-- CreateIndex
CREATE INDEX "Webhook_companyId_idx" ON "Webhook"("companyId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usage" ADD CONSTRAINT "Usage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobInterviewConfig" ADD CONSTRAINT "JobInterviewConfig_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBankDoc" ADD CONSTRAINT "QuestionBankDoc_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateJob" ADD CONSTRAINT "CandidateJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateJob" ADD CONSTRAINT "CandidateJob_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateJob" ADD CONSTRAINT "CandidateJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewQuestion" ADD CONSTRAINT "InterviewQuestion_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_interviewQuestionId_fkey" FOREIGN KEY ("interviewQuestionId") REFERENCES "InterviewQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeSubmission" ADD CONSTRAINT "CodeSubmission_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaChunk" ADD CONSTRAINT "MediaChunk_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctoringEvent" ADD CONSTRAINT "ProctoringEvent_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrityReport" ADD CONSTRAINT "IntegrityReport_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationReport" ADD CONSTRAINT "EvaluationReport_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_guestLinkId_fkey" FOREIGN KEY ("guestLinkId") REFERENCES "GuestLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestLink" ADD CONSTRAINT "GuestLink_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;


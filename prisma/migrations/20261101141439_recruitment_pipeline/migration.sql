-- CreateEnum
CREATE TYPE "JobRoundType" AS ENUM ('L1_AI', 'L2_TECH', 'DIRECTOR', 'CODING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RoundConductor" AS ENUM ('AI', 'HUMAN');

-- CreateEnum
CREATE TYPE "MeetProvider" AS ENUM ('GOOGLE_MEET', 'MICROSOFT_TEAMS', 'LIVEKIT', 'PSTN');

-- CreateEnum
CREATE TYPE "SourcingSource" AS ENUM ('NAUKRI', 'LINKEDIN', 'MANUAL');

-- CreateEnum
CREATE TYPE "OutboundCampaignStatus" AS ENUM ('DRAFT', 'RUNNING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OutboundCallStatus" AS ENUM ('QUEUED', 'DIALING', 'SCHEDULED', 'NO_ANSWER', 'FAILED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InterviewScheduleStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RecruitmentDecisionOutcome" AS ENUM ('HOLD', 'SELECT', 'REJECT');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "integrations" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "JobRound" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "roundType" "JobRoundType" NOT NULL,
    "conductor" "RoundConductor" NOT NULL,
    "meetProvider" "MeetProvider" NOT NULL DEFAULT 'LIVEKIT',
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourcingAgentConfig" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sources" "SourcingSource"[] DEFAULT ARRAY['MANUAL']::"SourcingSource"[],
    "atsMinScore" INTEGER NOT NULL DEFAULT 70,
    "nonAtsMaxPercent" INTEGER NOT NULL DEFAULT 20,
    "searchKeywords" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "lastRunSummary" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourcingAgentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeIngestFingerprint" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "source" "SourcingSource" NOT NULL,
    "externalId" TEXT,
    "contentHash" TEXT NOT NULL,
    "candidateId" TEXT,
    "resumeId" TEXT,
    "atsScore" INTEGER,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeIngestFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundCallCampaign" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdById" TEXT,
    "promptTemplate" TEXT NOT NULL,
    "status" "OutboundCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundCallCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundCall" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "candidateJobId" TEXT NOT NULL,
    "status" "OutboundCallStatus" NOT NULL DEFAULT 'QUEUED',
    "phone" TEXT,
    "transcript" TEXT,
    "proposedSlot" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSchedule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateJobId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "meetProvider" "MeetProvider" NOT NULL DEFAULT 'GOOGLE_MEET',
    "meetUrl" TEXT,
    "calendarEventId" TEXT,
    "status" "InterviewScheduleStatus" NOT NULL DEFAULT 'PROPOSED',
    "confirmationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentDecision" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateJobId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "outcome" "RecruitmentDecisionOutcome" NOT NULL,
    "reason" TEXT,
    "decidedById" TEXT,
    "publicToken" TEXT NOT NULL,
    "candidateNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobRound_jobId_idx" ON "JobRound"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "JobRound_jobId_orderIndex_key" ON "JobRound"("jobId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "SourcingAgentConfig_jobId_key" ON "SourcingAgentConfig"("jobId");

-- CreateIndex
CREATE INDEX "ResumeIngestFingerprint_jobId_source_idx" ON "ResumeIngestFingerprint"("jobId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeIngestFingerprint_jobId_contentHash_key" ON "ResumeIngestFingerprint"("jobId", "contentHash");

-- CreateIndex
CREATE INDEX "OutboundCallCampaign_companyId_jobId_idx" ON "OutboundCallCampaign"("companyId", "jobId");

-- CreateIndex
CREATE INDEX "OutboundCall_campaignId_idx" ON "OutboundCall"("campaignId");

-- CreateIndex
CREATE INDEX "OutboundCall_candidateJobId_idx" ON "OutboundCall"("candidateJobId");

-- CreateIndex
CREATE INDEX "InterviewSchedule_companyId_scheduledAt_idx" ON "InterviewSchedule"("companyId", "scheduledAt");

-- CreateIndex
CREATE INDEX "InterviewSchedule_candidateJobId_idx" ON "InterviewSchedule"("candidateJobId");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentDecision_publicToken_key" ON "RecruitmentDecision"("publicToken");

-- CreateIndex
CREATE INDEX "RecruitmentDecision_companyId_jobId_idx" ON "RecruitmentDecision"("companyId", "jobId");

-- CreateIndex
CREATE INDEX "RecruitmentDecision_candidateJobId_idx" ON "RecruitmentDecision"("candidateJobId");

-- AddForeignKey
ALTER TABLE "JobRound" ADD CONSTRAINT "JobRound_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourcingAgentConfig" ADD CONSTRAINT "SourcingAgentConfig_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeIngestFingerprint" ADD CONSTRAINT "ResumeIngestFingerprint_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundCallCampaign" ADD CONSTRAINT "OutboundCallCampaign_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundCall" ADD CONSTRAINT "OutboundCall_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OutboundCallCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundCall" ADD CONSTRAINT "OutboundCall_candidateJobId_fkey" FOREIGN KEY ("candidateJobId") REFERENCES "CandidateJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSchedule" ADD CONSTRAINT "InterviewSchedule_candidateJobId_fkey" FOREIGN KEY ("candidateJobId") REFERENCES "CandidateJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentDecision" ADD CONSTRAINT "RecruitmentDecision_candidateJobId_fkey" FOREIGN KEY ("candidateJobId") REFERENCES "CandidateJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

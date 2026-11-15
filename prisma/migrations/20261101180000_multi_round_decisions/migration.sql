-- AlterTable
ALTER TABLE "CandidateJob" ADD COLUMN "currentRoundIndex" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN "jobRoundId" TEXT;

-- AlterTable
ALTER TABLE "InterviewSchedule" ADD COLUMN "jobRoundId" TEXT;
ALTER TABLE "InterviewSchedule" ADD COLUMN "accessToken" TEXT;

-- CreateTable
CREATE TABLE "DecisionReviewInvite" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateJobId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionReviewInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSchedule_accessToken_key" ON "InterviewSchedule"("accessToken");
CREATE UNIQUE INDEX "DecisionReviewInvite_token_key" ON "DecisionReviewInvite"("token");
CREATE INDEX "DecisionReviewInvite_companyId_candidateJobId_idx" ON "DecisionReviewInvite"("companyId", "candidateJobId");
CREATE INDEX "Interview_jobRoundId_idx" ON "Interview"("jobRoundId");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_jobRoundId_fkey" FOREIGN KEY ("jobRoundId") REFERENCES "JobRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DecisionReviewInvite" ADD CONSTRAINT "DecisionReviewInvite_candidateJobId_fkey" FOREIGN KEY ("candidateJobId") REFERENCES "CandidateJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

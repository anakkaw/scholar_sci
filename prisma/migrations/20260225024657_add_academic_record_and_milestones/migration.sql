-- AlterEnum
ALTER TYPE "AchievementType" ADD VALUE 'ACTIVITY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'ACADEMIC_RECORD_VERIFIED';
ALTER TYPE "AuditAction" ADD VALUE 'ACADEMIC_RECORD_REJECTED';

-- DropIndex
DROP INDEX "ProgressReport_userId_academicYear_semester_key";

-- AlterTable
ALTER TABLE "ProgressReport" ADD COLUMN     "milestoneId" TEXT;

-- CreateTable
CREATE TABLE "ReportMilestone" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetYearLevel" INTEGER NOT NULL,
    "targetSemester" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "gpa" DOUBLE PRECISION NOT NULL,
    "transcriptUrl" TEXT,
    "transcriptName" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewerAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportMilestone_scholarshipId_idx" ON "ReportMilestone"("scholarshipId");

-- CreateIndex
CREATE INDEX "AcademicRecord_userId_idx" ON "AcademicRecord"("userId");

-- CreateIndex
CREATE INDEX "AcademicRecord_status_idx" ON "AcademicRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicRecord_userId_academicYear_semester_key" ON "AcademicRecord"("userId", "academicYear", "semester");

-- CreateIndex
CREATE INDEX "ProgressReport_userId_milestoneId_idx" ON "ProgressReport"("userId", "milestoneId");

-- AddForeignKey
ALTER TABLE "ReportMilestone" ADD CONSTRAINT "ReportMilestone_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ReportMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicRecord" ADD CONSTRAINT "AcademicRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicRecord" ADD CONSTRAINT "AcademicRecord_reviewerAdminId_fkey" FOREIGN KEY ("reviewerAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

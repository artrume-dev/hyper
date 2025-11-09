-- AlterTable Team - Add hierarchical fields
ALTER TABLE "Team" ADD COLUMN "parentTeamId" TEXT;
ALTER TABLE "Team" ADD COLUMN "isMainTeam" BOOLEAN NOT NULL DEFAULT true;

-- Update Team type default (this won't affect existing rows)
-- Existing rows keep their current type value

-- CreateIndex for parentTeamId
CREATE INDEX "Team_parentTeamId_idx" ON "Team"("parentTeamId");

-- CreateTable JobPosting
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "minSalary" INTEGER,
    "maxSalary" INTEGER,
    "currency" TEXT DEFAULT 'USD',
    "teamId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobPosting_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobPosting_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex for JobPosting
CREATE INDEX "JobPosting_teamId_idx" ON "JobPosting"("teamId");
CREATE INDEX "JobPosting_createdBy_idx" ON "JobPosting"("createdBy");
CREATE INDEX "JobPosting_status_idx" ON "JobPosting"("status");
CREATE INDEX "JobPosting_teamId_status_idx" ON "JobPosting"("teamId", "status");

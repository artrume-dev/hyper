-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "message" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invitation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Invitation" ("createdAt", "expiresAt", "id", "message", "receiverId", "senderId", "status", "teamId", "updatedAt") SELECT "createdAt", "expiresAt", "id", "message", "receiverId", "senderId", "status", "teamId", "updatedAt" FROM "Invitation";
DROP TABLE "Invitation";
ALTER TABLE "new_Invitation" RENAME TO "Invitation";
CREATE INDEX "Invitation_senderId_idx" ON "Invitation"("senderId");
CREATE INDEX "Invitation_receiverId_idx" ON "Invitation"("receiverId");
CREATE INDEX "Invitation_teamId_idx" ON "Invitation"("teamId");
CREATE INDEX "Invitation_status_idx" ON "Invitation"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

/*
  Rename mediaFile column to mediaFiles to preserve existing data
*/
-- AlterTable: Rename column from mediaFile to mediaFiles
ALTER TABLE "Portfolio" RENAME COLUMN "mediaFile" TO "mediaFiles";

-- Update any null values to empty JSON array for consistency
UPDATE "Portfolio" SET "mediaFiles" = '[]' WHERE "mediaFiles" IS NULL;

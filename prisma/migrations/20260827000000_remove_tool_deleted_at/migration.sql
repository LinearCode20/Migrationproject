/*
  Warnings:

  - Soft-delete is removed: tools now hard-delete like every other entity. The
    `deletedAt` column and any rows still stamped with it are dropped.

*/
-- DeleteData
DELETE FROM "Tool" WHERE "deletedAt" IS NOT NULL;

-- AlterTable
ALTER TABLE "Tool" DROP COLUMN "deletedAt";

/*
  Warnings:

  - The values [Rejected] on the enum `ToolStatus` will be removed. Existing
    rejected tools are soft-deleted instead, which is what admins used in practice.

*/
-- AlterEnum
BEGIN;
UPDATE "Tool" SET "status" = 'Deleted' WHERE "status" = 'Rejected';
CREATE TYPE "ToolStatus_new" AS ENUM ('Draft', 'Scheduled', 'Pending', 'Published', 'Deleted');
ALTER TABLE "Tool" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Tool" ALTER COLUMN "status" TYPE "ToolStatus_new" USING ("status"::text::"ToolStatus_new");
ALTER TYPE "ToolStatus" RENAME TO "ToolStatus_old";
ALTER TYPE "ToolStatus_new" RENAME TO "ToolStatus";
DROP TYPE "ToolStatus_old";
ALTER TABLE "Tool" ALTER COLUMN "status" SET DEFAULT 'Draft';
COMMIT;

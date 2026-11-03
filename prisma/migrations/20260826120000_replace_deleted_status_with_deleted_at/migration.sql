/*
  Warnings:

  - The value [Deleted] on the enum `ToolStatus` will be removed. Soft-deletion
    is now driven by the `deletedAt` timestamp instead of a dedicated status.
    Existing `Deleted` rows are stamped with `deletedAt` and moved to `Draft`;
    their pre-delete status was never stored, so `Draft` is the safe restore
    target.

*/
-- AlterTable
ALTER TABLE "Tool" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterEnum
BEGIN;
UPDATE "Tool" SET "deletedAt" = now(), "status" = 'Draft' WHERE "status" = 'Deleted';
CREATE TYPE "ToolStatus_new" AS ENUM ('Draft', 'Scheduled', 'Pending', 'Published');
ALTER TABLE "Tool" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Tool" ALTER COLUMN "status" TYPE "ToolStatus_new" USING ("status"::text::"ToolStatus_new");
ALTER TYPE "ToolStatus" RENAME TO "ToolStatus_old";
ALTER TYPE "ToolStatus_new" RENAME TO "ToolStatus";
DROP TYPE "ToolStatus_old";
ALTER TABLE "Tool" ALTER COLUMN "status" SET DEFAULT 'Draft';
COMMIT;

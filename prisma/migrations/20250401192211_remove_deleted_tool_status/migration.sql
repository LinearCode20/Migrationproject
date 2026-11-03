/*
  Warnings:

  - The values [Deleted] on the enum `ToolStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ToolStatus_new" AS ENUM ('Draft', 'Scheduled', 'Published');
ALTER TABLE "Tool" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Tool" ALTER COLUMN "status" TYPE "ToolStatus_new" USING ("status"::text::"ToolStatus_new");
ALTER TYPE "ToolStatus" RENAME TO "ToolStatus_old";
ALTER TYPE "ToolStatus_new" RENAME TO "ToolStatus";
DROP TYPE "ToolStatus_old";
ALTER TABLE "Tool" ALTER COLUMN "status" SET DEFAULT 'Draft';
COMMIT;

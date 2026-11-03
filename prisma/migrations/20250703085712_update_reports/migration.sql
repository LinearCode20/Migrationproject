/*
  Warnings:

  - You are about to drop the column `userId` on the `Report` table. All the data in the column will be lost.
  - The `type` column on the `Report` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_userId_fkey";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "userId",
ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "type" TYPE TEXT,
ALTER COLUMN "type" SET DEFAULT 'Other';

-- DropEnum
DROP TYPE "ReportType";

-- AlterEnum
ALTER TYPE "ToolStatus" ADD VALUE 'Pending';

-- CreateIndex
CREATE INDEX "Tool_createdAt_idx" ON "Tool"("createdAt");

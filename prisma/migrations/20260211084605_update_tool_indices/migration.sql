-- DropIndex
DROP INDEX "Tool_tierPriority_createdAt_idx";

-- CreateIndex
CREATE INDEX "Tool_tierPriority_publishedAt_idx" ON "Tool"("tierPriority", "publishedAt");

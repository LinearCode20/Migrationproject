-- Add generated column for tier-based sorting
-- Premium = 0 (shown first), everything else = 1 (equal priority)
ALTER TABLE "Tool" ADD COLUMN "tierPriority" INTEGER
GENERATED ALWAYS AS (CASE WHEN tier = 'Premium' THEN 0 ELSE 1 END) STORED;

-- Add index for better query performance on the common sort pattern
CREATE INDEX "Tool_tierPriority_createdAt_idx" ON "Tool" ("tierPriority" ASC, "createdAt" DESC);

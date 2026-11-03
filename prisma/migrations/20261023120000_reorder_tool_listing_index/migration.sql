/*
  The public listing filters on `status` and orders by `tierPriority` ascending,
  then `publishedAt` descending, then `id`. This index follows that order, so
  Postgres reads the first page straight from it instead of sorting every
  listed tool. It leads with `status`, so it also serves every filter on
  `status` alone, and the single-column status index goes.
*/

-- DropIndex
DROP INDEX "Tool_status_idx";

-- DropIndex
DROP INDEX "Tool_tierPriority_publishedAt_idx";

-- CreateIndex
CREATE INDEX "Tool_status_tierPriority_publishedAt_id_idx" ON "Tool"("status", "tierPriority", "publishedAt" DESC, "id");

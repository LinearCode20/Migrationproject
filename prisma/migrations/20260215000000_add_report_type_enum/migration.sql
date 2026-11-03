-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('BrokenLink', 'WrongCategory', 'Outdated', 'Other');

-- Drop existing default before type change
ALTER TABLE "Report" ALTER COLUMN "type" DROP DEFAULT;

-- Migrate existing data and alter column
ALTER TABLE "Report" ALTER COLUMN "type" TYPE "ReportType"
USING (
  CASE "type"
    WHEN 'Broken Link' THEN 'BrokenLink'::"ReportType"
    WHEN 'Wrong Category' THEN 'WrongCategory'::"ReportType"
    WHEN 'Outdated' THEN 'Outdated'::"ReportType"
    ELSE 'Other'::"ReportType"
  END
);

-- Set new default
ALTER TABLE "Report" ALTER COLUMN "type" SET DEFAULT 'Other'::"ReportType";

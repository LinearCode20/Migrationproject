/*
  A tool has one owner account (`ownerId`) that manages the listing, and
  `verifiedAt` records that the owner proved control of the tool's domain.

  - Every tool that already has an owner keeps it and gets `verifiedAt`. An
    owner comes from domain verification or from paying for the listing, and
    both show the verified badge, so every owned tool keeps the badge.
  - A tool without an owner goes to the account whose verified email matches
    its submitter email, case-insensitively.
  - Any other tool stays without an owner. Its submitter claims it by
    verifying the domain or by submitting it again.
  - The `submitterEmail` and `submitterName` columns are dropped.
    `submitterNote` stays.
*/
BEGIN;

-- AlterTable
ALTER TABLE "Tool" ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- Backfill verifiedAt for existing owners
UPDATE "Tool" SET "verifiedAt" = CURRENT_TIMESTAMP WHERE "ownerId" IS NOT NULL;

-- Backfill owners from submitter emails of verified accounts
UPDATE "Tool" AS t
SET "ownerId" = u."id"
FROM (
  SELECT DISTINCT ON (lower("email")) "id", lower("email") AS "email"
  FROM "User"
  WHERE "emailVerified" = true
  ORDER BY lower("email"), "createdAt"
) AS u
WHERE t."ownerId" IS NULL
  AND lower(trim(t."submitterEmail")) = u."email";

-- AlterTable
ALTER TABLE "Tool" DROP COLUMN "submitterEmail",
DROP COLUMN "submitterName";

COMMIT;

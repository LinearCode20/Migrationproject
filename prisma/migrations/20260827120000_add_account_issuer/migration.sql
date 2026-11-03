/*
  better-auth 1.7 identifies an account by (issuer, accountId) instead of
  (providerId, accountId), and declares `issuer` as required with a unique
  compound index. Without the column every OAuth lookup fails with
  `PrismaClientValidationError` on `account.findFirst()` and sign-in breaks.

  Backfilled per the official 1.7 upgrade guide:
  https://better-auth.com/docs/guides/1-7-upgrade-guide

    credential                       -> local:credential
    provider with a trusted issuer   -> that issuer verbatim
    OAuth provider without an issuer -> local:oauth:<providerId>

  The three providers better-auth ships with a trusted issuer are handled by
  name; anything else a downstream has configured falls through to the
  `local:oauth:` form, which is what the guide prescribes.

  `accountId` is deliberately left alone. The guide has credential rows use the
  linked user's id, and better-auth already writes `accountId: user.id` when it
  creates one, so those rows are already correct.
*/

-- AlterTable: nullable first so the backfill can run
ALTER TABLE "Account" ADD COLUMN "issuer" TEXT;

-- Backfill
UPDATE "Account"
SET "issuer" = CASE "providerId"
  WHEN 'credential' THEN 'local:credential'
  WHEN 'google'     THEN 'https://accounts.google.com'
  WHEN 'apple'      THEN 'https://appleid.apple.com'
  WHEN 'facebook'   THEN 'https://www.facebook.com'
  ELSE 'local:oauth:' || "providerId"
END
WHERE "issuer" IS NULL;

-- Enforce
ALTER TABLE "Account" ALTER COLUMN "issuer" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Account_issuer_accountId_key" ON "Account"("issuer", "accountId");

/*
  better-auth 1.7.3 dropped `issuer` from its account schema and identifies an
  account by (providerId, accountId) again, as in 1.6. It no longer writes the
  column, so the NOT NULL `issuer` added by 20260827120000_add_account_issuer
  rejects every OAuth sign-up and account link with
  `Argument issuer is missing`.

  The 1.7 upgrade guide has Prisma projects regenerate the model, which drops
  both the field and the compound unique index:
  https://www.better-auth.com/docs/guides/1-7-upgrade-guide#account-identity-keeps-the-provider-key

  better-auth never reads the value, so dropping it loses nothing it uses. The
  index goes first, as the guide advises. Both statements are catalog-only in
  Postgres, so they are fast on a populated table. `IF EXISTS` keeps the
  migration safe on a database where someone already ran the guide's SQL by
  hand.
*/

-- DropIndex
DROP INDEX IF EXISTS "Account_issuer_accountId_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN IF EXISTS "issuer";

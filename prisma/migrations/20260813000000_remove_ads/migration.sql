/*
  Warnings:

  - The `Ad` table and the `AdType` enum are dropped. Ad serving moved to
    Revinel, so ads are no longer stored in this database.

*/
-- DropTable
DROP TABLE "Ad";

-- DropEnum
DROP TYPE "AdType";

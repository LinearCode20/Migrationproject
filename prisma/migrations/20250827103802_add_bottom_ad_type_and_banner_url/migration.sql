-- AlterEnum
ALTER TYPE "public"."AdType" ADD VALUE 'Bottom';

-- AlterTable
ALTER TABLE "public"."Ad" ADD COLUMN     "bannerUrl" TEXT;

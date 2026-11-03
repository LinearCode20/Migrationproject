/*
  Warnings:

  - A unique constraint covering the columns `[identifier]` on the table `Verification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Verification_identifier_key" ON "Verification"("identifier");

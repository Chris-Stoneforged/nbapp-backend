/*
  Warnings:

  - A unique constraint covering the columns `[bracket_name]` on the table `Bracket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Bracket" ALTER COLUMN "bracket_name" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Bracket_bracket_name_key" ON "Bracket"("bracket_name");

/*
  Warnings:

  - Added the required column `bracket_id` to the `Tournament` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "bracket_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_bracket_id_fkey" FOREIGN KEY ("bracket_id") REFERENCES "Bracket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

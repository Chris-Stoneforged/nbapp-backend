/*
  Warnings:

  - The primary key for the `Matchup` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Prediction" DROP CONSTRAINT "Prediction_matchup_id_fkey";

-- AlterTable
ALTER TABLE "Matchup" DROP CONSTRAINT "Matchup_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ADD CONSTRAINT "Matchup_pkey" PRIMARY KEY ("id", "bracket_id");
DROP SEQUENCE "Matchup_id_seq";

-- AlterTable
ALTER TABLE "Prediction" ADD COLUMN     "bracket_id" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_matchup_id_bracket_id_fkey" FOREIGN KEY ("matchup_id", "bracket_id") REFERENCES "Matchup"("id", "bracket_id") ON DELETE RESTRICT ON UPDATE CASCADE;

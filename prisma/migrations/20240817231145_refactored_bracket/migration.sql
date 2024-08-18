/*
  Warnings:

  - You are about to drop the column `bracket_data` on the `Bracket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bracket" DROP COLUMN "bracket_data",
ADD COLUMN     "bracket_name" TEXT NOT NULL DEFAULT 'Unknown Bracket';

-- CreateTable
CREATE TABLE "Matchup" (
    "id" SERIAL NOT NULL,
    "bracket_id" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "team_a" TEXT,
    "team_b" TEXT,
    "advances_to" INTEGER,

    CONSTRAINT "Matchup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Matchup" ADD CONSTRAINT "Matchup_bracket_id_fkey" FOREIGN KEY ("bracket_id") REFERENCES "Bracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_matchup_id_fkey" FOREIGN KEY ("matchup_id") REFERENCES "Matchup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

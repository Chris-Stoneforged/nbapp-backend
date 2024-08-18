-- DropForeignKey
ALTER TABLE "Tournament" DROP CONSTRAINT "Tournament_bracket_id_fkey";

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_bracket_id_fkey" FOREIGN KEY ("bracket_id") REFERENCES "Bracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

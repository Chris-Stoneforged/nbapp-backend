-- DropForeignKey
ALTER TABLE "InviteToken" DROP CONSTRAINT "InviteToken_tournament_id_fkey";

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

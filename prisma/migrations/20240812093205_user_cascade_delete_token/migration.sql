-- DropForeignKey
ALTER TABLE "InviteToken" DROP CONSTRAINT "InviteToken_sender_id_fkey";

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

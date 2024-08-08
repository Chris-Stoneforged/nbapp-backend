/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `InviteToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `InviteToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiry` to the `InviteToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_id` to the `InviteToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InviteToken" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "expiry" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "sender_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_code_key" ON "InviteToken"("code");

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

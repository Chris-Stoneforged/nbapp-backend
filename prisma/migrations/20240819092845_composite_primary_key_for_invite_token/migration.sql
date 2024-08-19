/*
  Warnings:

  - The primary key for the `InviteToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `InviteToken` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InviteToken" DROP CONSTRAINT "InviteToken_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("sender_id", "tournament_id");

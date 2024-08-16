-- CreateTable
CREATE TABLE "Prediction" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "matchup_id" INTEGER NOT NULL,
    "winner" TEXT NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

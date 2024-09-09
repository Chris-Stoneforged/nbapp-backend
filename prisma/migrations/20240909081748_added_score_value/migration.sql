-- CreateTable
CREATE TABLE "ScoreValue" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ScoreValue_id_key" ON "ScoreValue"("id");

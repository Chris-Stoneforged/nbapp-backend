-- CreateTable
CREATE TABLE "Bracket" (
    "id" SERIAL NOT NULL,
    "bracket_data" JSONB NOT NULL,

    CONSTRAINT "Bracket_pkey" PRIMARY KEY ("id")
);

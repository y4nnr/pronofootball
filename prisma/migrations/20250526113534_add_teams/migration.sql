/*
  Warnings:

  - You are about to drop the column `score1` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `score2` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `team1` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `team2` on the `Game` table. All the data in the column will be lost.
  - Added the required column `awayTeamId` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `homeTeamId` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "score1",
DROP COLUMN "score2",
DROP COLUMN "team1",
DROP COLUMN "team2",
ADD COLUMN     "awayScore" INTEGER,
ADD COLUMN     "awayTeamId" TEXT NOT NULL,
ADD COLUMN     "homeScore" INTEGER,
ADD COLUMN     "homeTeamId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

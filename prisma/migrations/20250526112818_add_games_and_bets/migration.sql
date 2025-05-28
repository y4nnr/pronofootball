/*
  Warnings:

  - The values [COMPLETED] on the enum `GameStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Bet` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `scoreA` on the `Bet` table. All the data in the column will be lost.
  - You are about to drop the column `scoreB` on the `Bet` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Bet` table. All the data in the column will be lost.
  - The primary key for the `Competition` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `status` column on the `Competition` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `CompetitionUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `isWinner` on the `CompetitionUser` table. All the data in the column will be lost.
  - You are about to drop the column `rank` on the `CompetitionUser` table. All the data in the column will be lost.
  - You are about to drop the column `totalPoints` on the `CompetitionUser` table. All the data in the column will be lost.
  - The primary key for the `Game` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `scoreA` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `scoreB` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `teamA` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `teamB` on the `Game` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `profilePictureUrl` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `UserStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[gameId,userId]` on the table `Bet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[competitionId,userId]` on the table `CompetitionUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `score1` to the `Bet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `score2` to the `Bet` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Competition` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `team1` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `team2` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GameStatus_new" AS ENUM ('UPCOMING', 'LIVE', 'FINISHED', 'CANCELLED');
ALTER TABLE "Game" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Game" ALTER COLUMN "status" TYPE "GameStatus_new" USING ("status"::text::"GameStatus_new");
ALTER TYPE "GameStatus" RENAME TO "GameStatus_old";
ALTER TYPE "GameStatus_new" RENAME TO "GameStatus";
DROP TYPE "GameStatus_old";
ALTER TABLE "Game" ALTER COLUMN "status" SET DEFAULT 'UPCOMING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Bet" DROP CONSTRAINT "Bet_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Bet" DROP CONSTRAINT "Bet_userId_fkey";

-- DropForeignKey
ALTER TABLE "CompetitionUser" DROP CONSTRAINT "CompetitionUser_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "CompetitionUser" DROP CONSTRAINT "CompetitionUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "UserStats" DROP CONSTRAINT "UserStats_userId_fkey";

-- DropIndex
DROP INDEX "Bet_userId_gameId_key";

-- DropIndex
DROP INDEX "CompetitionUser_userId_competitionId_key";

-- AlterTable
ALTER TABLE "Bet" DROP CONSTRAINT "Bet_pkey",
DROP COLUMN "scoreA",
DROP COLUMN "scoreB",
DROP COLUMN "status",
ADD COLUMN     "score1" INTEGER NOT NULL,
ADD COLUMN     "score2" INTEGER NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "gameId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Bet_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Bet_id_seq";

-- AlterTable
ALTER TABLE "Competition" DROP CONSTRAINT "Competition_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "description" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'upcoming',
ADD CONSTRAINT "Competition_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Competition_id_seq";

-- AlterTable
ALTER TABLE "CompetitionUser" DROP CONSTRAINT "CompetitionUser_pkey",
DROP COLUMN "isWinner",
DROP COLUMN "rank",
DROP COLUMN "totalPoints",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "competitionId" SET DATA TYPE TEXT,
ADD CONSTRAINT "CompetitionUser_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "CompetitionUser_id_seq";

-- AlterTable
ALTER TABLE "Game" DROP CONSTRAINT "Game_pkey",
DROP COLUMN "scoreA",
DROP COLUMN "scoreB",
DROP COLUMN "teamA",
DROP COLUMN "teamB",
ADD COLUMN     "score1" INTEGER,
ADD COLUMN     "score2" INTEGER,
ADD COLUMN     "team1" TEXT NOT NULL,
ADD COLUMN     "team2" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "competitionId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Game_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Game_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "profilePictureUrl",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user',
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "UserStats" DROP CONSTRAINT "UserStats_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "UserStats_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "Bet_gameId_userId_key" ON "Bet"("gameId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionUser_competitionId_userId_key" ON "CompetitionUser"("competitionId", "userId");

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionUser" ADD CONSTRAINT "CompetitionUser_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionUser" ADD CONSTRAINT "CompetitionUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

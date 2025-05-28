-- DropForeignKey
ALTER TABLE "CompetitionUser" DROP CONSTRAINT "CompetitionUser_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_competitionId_fkey";

-- AddForeignKey
ALTER TABLE "CompetitionUser" ADD CONSTRAINT "CompetitionUser_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

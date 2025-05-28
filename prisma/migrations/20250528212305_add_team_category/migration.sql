-- CreateEnum
CREATE TYPE "TeamCategory" AS ENUM ('NATIONAL', 'CLUB');

-- AlterTable
ALTER TABLE "Competition" ADD COLUMN     "lastPlaceId" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "winnerId" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "category" "TeamCategory" NOT NULL DEFAULT 'NATIONAL';

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_lastPlaceId_fkey" FOREIGN KEY ("lastPlaceId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

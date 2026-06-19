-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "leaderPasswordHash" DROP NOT NULL,
ALTER COLUMN "volunteerPasswordHash" DROP NOT NULL,
ALTER COLUMN "leaderPassword" DROP NOT NULL,
ALTER COLUMN "volunteerPassword" DROP NOT NULL;

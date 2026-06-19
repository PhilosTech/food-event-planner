-- AlterTable: add with default first, then remove default
ALTER TABLE "Room" ADD COLUMN "leaderPassword" TEXT NOT NULL DEFAULT '',
ADD COLUMN "volunteerPassword" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Room" ALTER COLUMN "leaderPassword" DROP DEFAULT,
ALTER COLUMN "volunteerPassword" DROP DEFAULT;

-- CreateTable
CREATE TABLE "RoomMember" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - The primary key for the `Review` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `reviewId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `userLogo` on the `Review` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Review" DROP CONSTRAINT "Review_pkey",
DROP COLUMN "reviewId",
DROP COLUMN "userLogo",
ADD COLUMN     "reviewID" SERIAL NOT NULL,
ADD CONSTRAINT "Review_pkey" PRIMARY KEY ("reviewID");

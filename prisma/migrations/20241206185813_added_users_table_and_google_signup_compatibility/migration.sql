/*
  Warnings:

  - Added the required column `isGoogleUser` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleUID" TEXT,
ADD COLUMN     "isGoogleUser" BOOLEAN NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

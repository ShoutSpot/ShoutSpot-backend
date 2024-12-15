-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "reviewVideo" TEXT;

-- AlterTable
ALTER TABLE "Space" ALTER COLUMN "textButtonText" SET DEFAULT 'Record a text';

-- CreateTable
CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "spaceName" TEXT NOT NULL,
    "logo" TEXT,
    "squareLogo" BOOLEAN NOT NULL DEFAULT false,
    "spaceHeading" TEXT NOT NULL,
    "customMessage" TEXT NOT NULL,
    "collectionType" TEXT NOT NULL,
    "collectStarRatings" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL,
    "thankYouImage" TEXT,
    "thankYouTitle" TEXT DEFAULT 'Thank you!',
    "thankYouMessage" TEXT DEFAULT 'Thank you so much for your shoutout! It means a ton for us! 🙏',
    "redirectPageLink" TEXT,
    "maxVideoDuration" INTEGER NOT NULL DEFAULT 30,
    "maxCharsAllowed" INTEGER NOT NULL DEFAULT 128,
    "videoButtonText" TEXT NOT NULL DEFAULT 'Record a video',
    "textButtonText" TEXT NOT NULL DEFAULT 'Record a video',
    "consentText" TEXT DEFAULT 'I give permission to use this testimonial',
    "textSubmissionTitle" TEXT,
    "questionLabel" TEXT DEFAULT 'QUESTIONS',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "spaceId" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectExtraInfo" (
    "id" TEXT NOT NULL,
    "name" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "company" BOOLEAN NOT NULL DEFAULT false,
    "socialLink" BOOLEAN NOT NULL DEFAULT false,
    "address" BOOLEAN NOT NULL DEFAULT false,
    "spaceId" TEXT NOT NULL,

    CONSTRAINT "CollectExtraInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "reviewType" TEXT NOT NULL,
    "positiveStarsCount" INTEGER NOT NULL DEFAULT 0,
    "reviewText" TEXT,
    "reviewImage" TEXT,
    "userDetails" JSONB NOT NULL,
    "isLiked" BOOLEAN NOT NULL DEFAULT false,
    "submitDateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "spaceId" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectExtraInfo_spaceId_key" ON "CollectExtraInfo"("spaceId");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectExtraInfo" ADD CONSTRAINT "CollectExtraInfo_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

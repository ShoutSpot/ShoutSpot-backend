import express from "express";
import authenticateToken from "../middleware/authenticateToken";
import prisma from "../prisma";
import { Response } from 'express';
import { AuthenticatedRequest } from '../modals/modal';
import { s3 } from ".";


const router = express.Router();
router.use(authenticateToken);


//get all spaces route pertaining to a particular user
router.get("/", async (req: any, res: any) => {
    const userId = req.id;

    if (!userId) {
        return res.status(400).json({ message: 'UserId is missing' });
    }

    try {
        const spaces = await prisma.space.findMany({
            where: {
                userId: userId,
            },
            include: {
                questions: true,
                collectExtraInfo: true,
                reviews: true
            },
        });

        // Generate pre-signed URLs for each space
        const updatedSpaces = await Promise.all(spaces.map(async space => {
            const logoUrl = space.logo ? await getPresignedUrl(space.logo, 'getObject', 3600) : null;
            const thankYouImageUrl = space.thankYouImage ? await getPresignedUrl(space.thankYouImage, 'getObject', 3600) : null;
            const textCount = space.reviews.filter(review => review.reviewType === 'text').length;
            const videoCount = space.reviews.filter(review => review.reviewType === 'video').length;
            delete (space as any).reviews;
            delete (space as any).userId;
            space.questions.forEach((question: any) => {
                delete question.questionId;
                delete question.spaceId;
            })
            delete(space as any).collectExtraInfo.spaceId;
            delete(space as any).collectExtraInfo.id;

            return {
                videoCount, textCount,
                spaceInfo: {
                    ...space,
                    logo: logoUrl,
                    thankYouImage: thankYouImageUrl
                }
            };
        }));

        res.status(200).json({ spaces: updatedSpaces });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch spaces', error });
    }
});

router.get("/single-space/:spaceName", async (req: any, res: any) => {
    const userId = req.id;

    if (!userId) {
        return res.status(400).json({ message: 'UserId is missing' });
    }

    const { spaceName } = req.params;

    if (!spaceName) {
        return res.status(400).json({ message: 'spaceName is missing' });
    }

    try {
        const space = await prisma.space.findFirst({
            where: {
                spaceName: spaceName,
                userId: userId
            },
            include: {
                questions: true, // Include related questions
                collectExtraInfo: true, // Include related extra info
            },
        });

        if (!space) {
            return res.status(404).json({ message: 'Space not found' });
        }

        // Generate pre-signed URLs for the space
        const logoUrl = space.logo ? await getPresignedUrl(space.logo, 'getObject', 3600) : null;
        const thankYouImageUrl = space.thankYouImage ? await getPresignedUrl(space.thankYouImage, 'getObject', 3600) : null;
        space.questions.forEach((question: any) => {
            delete question.questionId;
            delete question.spaceId;
        })

        const updatedSpace = {
            ...space,
            logo: logoUrl,
            thankYouImage: thankYouImageUrl
        };

        res.status(200).json({ space: updatedSpace });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch space', error });
    }
});


//route to create a new space
router.post("/", async (req: any, res: any) => {
    const {
        spaceName,
        logo,
        squareLogo,
        spaceHeading,
        customMessage,
        questions,
        collectExtraInfo,
        collectionType,
        collectStarRatings,
        language,
        thankYouImage,
        thankYouTitle,
        thankYouMessage,
        redirectPageLink,
        maxVideoDuration,
        maxCharsAllowed,
        videoButtonText,
        textButtonText,
        consentText,
        textSubmissionTitle,
        questionLabel,
    } = req.body;

    const userId = req.id;
    if (!userId) {
        return res.status(400).json({ message: 'UserId is missing' });
    }
    try {
        const existingSpace = await prisma.space.findFirst({
            where: {
                userId: userId,
                spaceName: spaceName,
            }
        });

        if (existingSpace) {
            return res.status(400).json({ message: 'A space with this name already exists.' });
        }

        const newSpace = await prisma.space.create({
            data: {
                spaceName,
                logo,
                squareLogo: squareLogo || false,
                spaceHeading,
                customMessage,
                collectionType,
                collectStarRatings: collectStarRatings || false,
                language,
                thankYouImage,
                thankYouTitle: thankYouTitle || 'Thank you!',
                thankYouMessage: thankYouMessage || 'Thank you so much for your shoutout! It means a ton for us! 🙏',
                redirectPageLink,
                maxVideoDuration: maxVideoDuration || 30,
                maxCharsAllowed: maxCharsAllowed || 128,
                videoButtonText: videoButtonText || 'Record a video',
                textButtonText: textButtonText || 'Record a text',
                consentText: consentText || 'I give permission to use this testimonial',
                textSubmissionTitle,
                questionLabel: questionLabel || 'QUESTIONS',
                userId,
                questions: {
                    create: questions.map((question: { text: string; id: number }) => ({
                        text: question.text,
                        id: question.id,
                    })),
                },
                collectExtraInfo: collectExtraInfo
                    ? {
                        create: {
                            name: collectExtraInfo.name || false,
                            email: collectExtraInfo.email || false,
                            company: collectExtraInfo.company || false,
                            socialLink: collectExtraInfo.socialLink || false,
                            address: collectExtraInfo.address || false,
                        },
                    }
                    : undefined,
            },
        });

        res.status(201).json(newSpace);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create space', error });
    }
});

//route to update a particular space
router.put("/", async (req: any, res: any) => {
    const userId = req.id;

    const {
        id: spaceId,
        spaceName,
        logo,
        squareLogo,
        spaceHeading,
        customMessage,
        questions,
        collectExtraInfo,
        collectionType,
        collectStarRatings,
        language,
        thankYouImage,
        thankYouTitle,
        thankYouMessage,
        redirectPageLink,
        maxVideoDuration,
        maxCharsAllowed,
        videoButtonText,
        textButtonText,
        consentText,
        textSubmissionTitle,
        questionLabel,
    } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'UserId is missing' });
    }

    try {
        const existingSpace = await prisma.space.findUnique({
            where: { id: spaceId },
            include: { user: true },
        });

        if (!existingSpace) {
            return res.status(404).json({ message: 'Space not found' });
        }

        if (existingSpace.userId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to update this space' });
        }

         // Check if any other space with the same name exists for this user
        const duplicateSpace = await prisma.space.findFirst({
            where: {
                userId: userId,
                spaceName: spaceName,
                NOT: { id: spaceId }  // Exclude the current space from the check
            }
        });

        if (duplicateSpace) {
            return res.status(409).json({ message: 'Another space with the same name already exists.' });
        }

        prisma.question.deleteMany({
            where: {
                spaceId: spaceId,
            },
        });

        const updatedSpace = await prisma.space.update({
            where: { id: spaceId },
            data: {
                spaceName,
                logo,
                squareLogo: squareLogo || false,
                spaceHeading,
                customMessage,
                collectionType,
                collectStarRatings: collectStarRatings || false,
                language,
                thankYouImage,
                thankYouTitle: thankYouTitle || 'Thank you!',
                thankYouMessage: thankYouMessage || 'Thank you so much for your shoutout! It means a ton for us! 🙏',
                redirectPageLink,
                maxVideoDuration: maxVideoDuration || 30,
                maxCharsAllowed: maxCharsAllowed || 128,
                videoButtonText: videoButtonText || 'Record a video',
                textButtonText: textButtonText || 'Record a text',
                consentText: consentText || 'I give permission to use this testimonial',
                textSubmissionTitle,
                questionLabel: questionLabel || 'QUESTIONS',
                questions: {
                    create: questions.map((question: { text: string; order: number }) => ({
                        text: question.text,
                        order: question.order,
                    })),
                },
                collectExtraInfo: collectExtraInfo
                    ? {
                        update: {
                            name: collectExtraInfo.name,
                            email: collectExtraInfo.email,
                            company: collectExtraInfo.company,
                            socialLink: collectExtraInfo.socialLink,
                            address: collectExtraInfo.address
                        },
                    }
                    : undefined,
            },
        });
        res.status(200).json(updatedSpace);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update space', error });
    }
});

//route to delete a particular space
router.delete("/", async (req: any, res: any) => {
    const { id: spaceId } = req.body;
    const userId = req.id;

    if (!userId) {
        return res.status(400).json({ message: 'UserId is missing' });
    }

    if (!spaceId) {
        return res.status(400).json({ message: 'Space ID is required' });
    }

    try {
        const existingSpace = await prisma.space.findUnique({
            where: { id: spaceId },
            select: { userId: true },
        });

        if (!existingSpace) {
            return res.status(404).json({ message: 'Space not found' });
        }

        if (existingSpace.userId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this space' });
        }

        await prisma.$transaction([
            prisma.question.deleteMany({
                where: { spaceId },
            }),

            prisma.collectExtraInfo.delete({
                where: { spaceId },
            }),

            prisma.space.delete({
                where: { id: spaceId },
            }),

            prisma.review.deleteMany({
                where: { spaceId: spaceId },
            }),
        ]);

        res.status(200).json({ message: 'Space deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete space', error });
    }
});

async function getPresignedUrl(objectUrl: string | null | undefined, operation: AWS.S3.Types.ObjectKey = 'getObject', expires: number = 3600){
    if (!objectUrl) return null; // Return null immediately if there's no key
    const url = new URL(objectUrl);
    const key = url.pathname.substring(1); 

    const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        Expires: expires
    };

    return new Promise<string>((resolve, reject) => {
        s3.getSignedUrl(operation, params, (err, url) => {
            if (err) {
                reject(err);
            } else {
                resolve(url);
            }
        });
    });
}

export default router;

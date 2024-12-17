import express from 'express';
import prisma from '../prisma';
import authenticateToken from '../middleware/authenticateToken';
import { s3 } from '.';

const router = express.Router();
router.use(authenticateToken);

const getPresignedUrl = async (objectUrl:string | null | undefined, expiresIn = 3600) => {
    if (!objectUrl) return null; // Return null immediately if there's no key
    const url = new URL(objectUrl);
    const key = url.pathname.substring(1); 

    const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Expires: expiresIn, // default to 1 hour
    };

    return new Promise((resolve, reject) => {
        s3.getSignedUrl('getObject', s3Params, (err, url) => {
            if (err) {
                reject(err);
            } else {
                resolve(url);
            }
        });
    });
};

router.get('/', async (req: any, res: any) => {
     const userId = req.id;

    if (!userId) {
        return res.status(400).json({ message: 'UserId is missing' });
    }

    const spaceId = parseInt(req.query.spaceId, 10);

    if (!spaceId) {
        return res.status(400).json({ message: 'Invalid spaceID' });
    }

    try {
        const reviews = await prisma.review.findMany({
            where: {
                spaceId: spaceId,
            },
        });

        const space = await prisma.space.findFirst({
            where: {
                id: spaceId,
            },
        });

        const spaceLogo = await getPresignedUrl(space?.logo);

        // Generate pre-signed URLs for the reviews
        const updatedReviews = await Promise.all(reviews.map(async review => {
            const reviewImageURL = await getPresignedUrl(review.reviewImage);
            const reviewVideoURL = await getPresignedUrl(review.reviewVideo);
            const userLogoURL = await getPresignedUrl((review.userDetails as { userPhoto?: string })?.userPhoto);
            delete (review as any).spaceId;

            return {
                ...review,
                reviewImage: reviewImageURL,
                reviewVideo: reviewVideoURL,
                userDetails: {
                    ...(typeof review.userDetails === "object" && review.userDetails !== null
                        ? review.userDetails
                        : {}),
                    userPhoto: userLogoURL,
                },
            };
        }));

        res.json({reviews: updatedReviews, spaceLogo});
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve reviews', error });
    }
});

router.post("/", async (req: any, res: any) => {
    const {
        reviewType,
        positiveStarsCount,
        reviewText,
        reviewImage,
        reviewVideo,
        userDetails,
        spaceId,
    } = req.body;

    if (!spaceId || !reviewType || !userDetails) {
        return res.status(400).json({ message: 'Missing required fields: spaceId, reviewType, or userDetails' });
    }

    try {
        const newReview = await prisma.review.create({
            data: {
                reviewType,
                positiveStarsCount: positiveStarsCount || 5,
                reviewText,
                reviewImage,
                reviewVideo,
                userDetails: userDetails,
                spaceId,
            },
        });

        res.status(201).json(newReview);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add review', error });
    }
});

router.put('/', async (req: any, res: any) => {
    const {
        reviewID,
        isLiked,
        isSpam,
    } = req.body;

    if (!reviewID) {
        return res.status(400).json({ message: 'Review ID is missing' });
    }

    try {
        const existingReview = await prisma.review.findUnique({
            where: { reviewID },
        });

        if (!existingReview) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const updatedReview = await prisma.review.update({
            where: { reviewID },
            data: {
                isLiked: isLiked,
                isSpam: isSpam
            },
        });

        res.status(200).json(updatedReview);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update review', error });
    }
});

router.delete('/', async (req: any, res: any) => {
    const { reviewID } = req.body;

    if (!reviewID) {
        return res.status(400).json({ message: 'Review ID is missing' });
    }

    try {
        await prisma.review.delete({
            where: {
                reviewID
            }
        });

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete review', error });
    }
});


export default router;
import express from 'express';
import prisma from '../prisma';
import authenticateToken from '../middleware/authenticateToken';
import { s3 } from '.';

const router = express.Router();
router.use(authenticateToken);

const getPresignedUrl = async (key:string | null, expiresIn = 3600) => {
    if (!key) return null; // Return null immediately if there's no key

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
    const { spaceId } = req.body;

    if (!spaceId) {
        return res.status(400).json({ message: 'Invalid spaceID' });
    }

    try {
        const reviews = await prisma.review.findMany({
            where: {
                spaceId: spaceId,
            },
        });

        // Generate pre-signed URLs for the reviews
        const updatedReviews = await Promise.all(reviews.map(async review => {
            const reviewImageURL = await getPresignedUrl(review.reviewImage);
            const reviewVideoURL = await getPresignedUrl(review.reviewVideo);
            const userLogoURL = await getPresignedUrl(review.userLogo);

            return {
                ...review,
                reviewImage: reviewImageURL,
                reviewVideo: reviewVideoURL,
                userLogo: userLogoURL,
            };
        }));

        res.json({reviews: updatedReviews});
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
                userDetails: JSON.stringify(userDetails),
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
        id: reviewId,
        reviewType,
        positiveStarsCount,
        reviewText,
        reviewImage,
        reviewVideo,
        userLogo,
        userDetails,
        isLiked,
        isSpam,
    } = req.body;

    if (!reviewId) {
        return res.status(400).json({ message: 'Review ID is missing' });
    }

    try {
        const existingReview = await prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!existingReview) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                reviewType: reviewType,
                positiveStarsCount: positiveStarsCount,
                reviewText: reviewText,
                reviewImage: reviewImage,
                reviewVideo: reviewVideo,
                userLogo: userLogo,
                userDetails: userDetails,
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
    const { id: reviewId } = req.body;

    if (!reviewId) {
        return res.status(400).json({ message: 'Review ID is missing' });
    }

    try {
        await prisma.review.delete({
            where: {
                id: reviewId
            }
        });

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete review', error });
    }
});


export default router;
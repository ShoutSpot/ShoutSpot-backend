import express from 'express';
import prisma from '../prisma';
import AWS from 'aws-sdk';
import authenticateToken from '../middleware/authenticateToken';
import { s3 } from '.';

const router = express.Router();
router.use(authenticateToken);


// Endpoint to generate a pre-signed URL
router.get('/', async (req: any, res: any) => {
    const { fileName, fileType } = req.query;

    // Ensure file name and type are provided
    if (!fileName || !fileType) {
        return res.status(400).json({ message: 'File name and type are required' });
    }

    const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `Images/${fileName}`,
        Expires: 60 * 5, // URL expires in 5 minutes
        ContentType: fileType,
        ACL: 'private'
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if (err) {
            res.status(500).json({ message: 'Could not generate presigned URL' });
            return;
        }
        res.json({ url: data });
    });
});

export default router;
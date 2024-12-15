// src/routes/index.ts
import express from "express";
import { signup, login } from "../controllers/auth.controller";
import spacesRoutes from './spaces';
import review from './reviews';
import generate_presigned_url from './presignedURL';
import AWS from "aws-sdk";

const router = express.Router();
export const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Authentication Routes
router.post("/signup", signup); // Sign-Up Route
router.post("/login", login);   // Login Route
router.use("/spaces", spacesRoutes);
router.use("/reviews", review);
router.use("/generate-presigned-url", generate_presigned_url);

export default router;

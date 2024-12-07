// src/routes/index.ts
import express from "express";
import { signup, login } from "../controllers/auth.controller";

const router = express.Router();

// Authentication Routes
router.post("/signup", signup); // Sign-Up Route
router.post("/login", login);   // Login Route

export default router;

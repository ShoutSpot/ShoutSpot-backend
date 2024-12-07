// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import prisma from "../prisma"; // Prisma client instance
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env"; // Contains JWT_SECRET

// Sign-Up Handler
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstname, email, password, googleUID, googleSignUp } = req.body;

    // Validate inputs for Google and normal users
    if (!email || !firstname) {
      res.status(400).json({ error: "Firstname and email are required." });
      return;
    }

    if (!googleSignUp && !password) {
      res.status(400).json({ error: "Password is required for normal sign-up." });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "User already exists. Please sign in instead." });
      return;
    }

    let newUser;

    if (googleSignUp) {
      // Handle Google Sign-Up
      newUser = await prisma.user.create({
        data: {
          firstname,
          email,
          googleUID,
          isGoogleUser: true,
        },
      });
    } else {
      // Handle Email/Password Sign-Up
      const hashedPassword = await bcrypt.hash(password, 10);
      newUser = await prisma.user.create({
        data: {
          firstname,
          email,
          password: hashedPassword,
          isGoogleUser: false,
        },
      });
    }

    // Respond with the created user details
    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: newUser.id,
        firstname: newUser.firstname,
        email: newUser.email,
        isGoogleUser: newUser.isGoogleUser,
      },
    });
  } catch (error) {
    console.error("Sign-Up Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};


// Login Handler
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, googleUID, googleSignIn } = req.body;

    let user;

    if (googleSignIn) {
      // Handle Google Sign-In
      if (!googleUID) {
        res.status(400).json({ error: "Google UID is required for Google sign-in." });
        return;
      }

      user = await prisma.user.findFirst({ where: { googleUID } });
      if (!user) {
        res.status(404).json({ error: "Google user not found. Please sign up first." });
        return;
      }
    } else {
      // Handle Email/Password Sign-In
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required for sign-in." });
        return;
      }

      user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.isGoogleUser) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password || "");
      if (!isPasswordValid) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }
    }

    if (!env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in the environment variables.");
    }    

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Respond with the token and user details
    res.status(200).json({
      message: "Sign-in successful.",
      token,
      user: {
        id: user.id,
        firstname: user.firstname,
        email: user.email,
        role: user.role,
        isGoogleUser: user.isGoogleUser,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

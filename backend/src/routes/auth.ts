import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { ENV } from "../config/env";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

/**
 * Helper: sign a JWT with the configured secret and expiry.
 */
function signToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
  });
}

/**
 * POST /api/auth/register
 * Create a new user account.
 * Body: { email, password, storeName }
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, storeName } = req.body;

    // Validate required fields
    if (!email || !password || !storeName) {
      res.status(400).json({ error: "email, password, and storeName are required." });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { storeName }],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? "email" : "storeName";
      res.status(409).json({ error: `A user with this ${field} already exists.` });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        storeName,
      },
      select: {
        id: true,
        email: true,
        storeName: true,
        planStatus: true,
        createdAt: true,
      },
    });

    // Generate JWT
    const token = signToken({ userId: user.id, email: user.email });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * POST /api/auth/login
 * Authenticate a user and return a JWT.
 * Body: { email, password }
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required." });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Generate JWT
    const token = signToken({ userId: user.id, email: user.email });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        storeName: user.storeName,
        planStatus: user.planStatus,
        stripeConnectId: user.stripeConnectId,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 */
router.get(
  "/me",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          email: true,
          storeName: true,
          planStatus: true,
          stripeConnectId: true,
          stripeCustomerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: "User not found." });
        return;
      }

      res.json({ user });
    } catch (err) {
      console.error("Get me error:", err);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

export default router;

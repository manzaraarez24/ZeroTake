import { Router, Request, Response } from "express";
import { getRazorpayClient } from "../lib/razorpay";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { ENV } from "../config/env";

const router = Router();

/**
 * POST /api/razorpay/create-order
 * Public — creates a Razorpay order for a product purchase.
 * Amount is in paise (INR smallest unit): price × 100.
 */
router.post("/create-order", async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, buyerEmail } = req.body;

    if (!productId || !buyerEmail) {
      res.status(400).json({ error: "productId and buyerEmail are required." });
      return;
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, isPublished: true },
    });

    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }

    const razorpay = getRazorpayClient();
    const amountInPaise = Math.round(product.price * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${productId.slice(0, 8)}_${Date.now()}`,
      notes: { productId, buyerEmail },
    } as any);

    res.json({
      orderId: (order as any).id,
      amount: (order as any).amount,
      currency: (order as any).currency,
      keyId: ENV.RAZORPAY_KEY_ID,
      productTitle: product.title,
    });
  } catch (err: any) {
    console.error("Razorpay create-order error:", err);
    res.status(500).json({ error: err.message || "Failed to create Razorpay order." });
  }
});

/**
 * POST /api/razorpay/create-subscription
 * Auth required — creates a Razorpay subscription for the ₹1900/mo creator plan.
 */
router.post("/create-subscription", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const razorpay = getRazorpayClient();

    let planId = ENV.RAZORPAY_PLAN_ID;

    if (!planId) {
      const plan = await (razorpay as any).plans.create({
        period: "monthly",
        interval: 1,
        item: {
          name: "ZeroTake Pro",
          amount: 190000, // ₹1900 in paise
          currency: "INR",
          description: "ZeroTake Creator Subscription — $0 transaction fees",
        },
      });
      planId = plan.id;
    }

    const subscription = await (razorpay as any).subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120,
      notes: { userId, userEmail: user.email },
    });

    res.json({
      subscriptionId: subscription.id,
      keyId: ENV.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error("Razorpay create-subscription error:", err);
    res.status(500).json({ error: err.message || "Failed to create Razorpay subscription." });
  }
});

export default router;

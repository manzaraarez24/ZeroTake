import { Router, Request, Response } from "express";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { ENV } from "../config/env";
// No direct Razorpay client needed here — verification uses HMAC only

const router = Router();

/**
 * POST /api/webhooks/razorpay
 * Expects express.raw() body — registered before express.json() in index.ts.
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers["x-razorpay-signature"] as string;

  if (!signature) {
    res.status(400).send("Missing x-razorpay-signature header.");
    return;
  }

  const rawBody = req.body as Buffer;
  const expectedSignature = crypto
    .createHmac("sha256", ENV.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    res.status(400).send("Invalid webhook signature.");
    return;
  }

  let event: any;
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    res.status(400).send("Invalid JSON payload.");
    return;
  }

  console.log(`📡 Razorpay Webhook: ${event.event}`);

  try {
    switch (event.event) {
      case "subscription.activated":
      case "subscription.charged": {
        const notes = event.payload?.subscription?.entity?.notes;
        const userId = notes?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { planStatus: "ACTIVE" },
          });
          console.log(`✅ Razorpay: Plan ACTIVE for user ${userId}`);
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.completed": {
        const notes = event.payload?.subscription?.entity?.notes;
        const userId = notes?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { planStatus: "FREE" },
          });
          console.log(`😢 Razorpay: Plan FREE for user ${userId}`);
        }
        break;
      }

      case "payment.captured": {
        // Product purchase — order creation handled in Phase 5
        const notes = event.payload?.payment?.entity?.notes;
        console.log(`💰 Razorpay: Payment captured — product ${notes?.productId}, buyer ${notes?.buyerEmail}`);
        break;
      }

      default:
        console.log(`ℹ️ Razorpay: Unhandled event ${event.event}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("Razorpay webhook DB error:", err);
    res.status(500).send("Database error.");
  }
});

export default router;

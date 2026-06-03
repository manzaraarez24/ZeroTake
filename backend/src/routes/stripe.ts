import { Router, Response } from "express";
import prisma from "../lib/prisma";
import stripe from "../lib/stripe";
import Stripe from "stripe";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { ENV } from "../config/env";

const router = Router();

// Apply auth middleware to all Stripe management routes
router.use(authMiddleware);

/**
 * Helper: Find or create the $19/mo platform subscription price in Stripe
 */
async function getOrCreateSubscriptionPriceId(): Promise<string> {
  const products = await stripe.products.list({ limit: 100 });
  let product = products.data.find(
    (p: any) => p.name === "Storefront Creator Subscription"
  );

  if (!product) {
    product = await stripe.products.create({
      name: "Storefront Creator Subscription",
      description: "Platform SaaS access - $19/mo storefront hosting with $0 transaction fees.",
    });
  }

  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
  });

  let price = prices.data.find(
    (p: any) => p.unit_amount === 1900 && p.recurring?.interval === "month"
  );

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: 1900,
      currency: "usd",
      recurring: { interval: "month" },
    });
  }

  return price.id;
}

/**
 * GET /api/stripe/connect/onboard
 * Initiates the Stripe Connect Standard onboarding for a creator
 */
router.get("/connect/onboard", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    let stripeConnectId = user.stripeConnectId;

    // Create a new connected account if they don't have one
    if (!stripeConnectId) {
      const account = await stripe.accounts.create({
        type: "standard",
        email: user.email,
        business_profile: {
          name: user.storeName,
        },
        metadata: {
          userId,
        },
      });

      stripeConnectId = account.id;

      // Update the user record
      await prisma.user.update({
        where: { id: userId },
        data: { stripeConnectId },
      });
    }

    // Generate onboarding links
    const accountLink = await stripe.accountLinks.create({
      account: stripeConnectId,
      refresh_url: `${ENV.FRONTEND_URL}/dashboard/settings?stripe_connect=refresh`,
      return_url: `${ENV.FRONTEND_URL}/dashboard/settings?stripe_connect=success`,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });
  } catch (err: any) {
    console.error("Stripe Connect onboarding error:", err);
    res.status(500).json({ error: err.message || "Failed to generate onboarding link." });
  }
});

/**
 * GET /api/stripe/connect/status
 * Verifies if the creator's Stripe Connect account is fully set up
 */
router.get("/connect/status", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeConnectId) {
      res.json({ isConnected: false });
      return;
    }

    const account = await stripe.accounts.retrieve(user.stripeConnectId);

    const isConnected = account.charges_enabled && account.details_submitted;

    res.json({
      isConnected: !!isConnected,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (err: any) {
    console.error("Stripe Connect status check error:", err);
    res.status(500).json({ error: err.message || "Failed to check Connect status." });
  }
});

/**
 * POST /api/stripe/subscription/checkout
 * Create a Stripe Checkout session for the $19/mo creator plan
 */
router.post("/subscription/checkout", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    let stripeCustomerId = user.stripeCustomerId;

    // Create a Stripe Customer if not already present
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    const priceId = await getOrCreateSubscriptionPriceId();

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${ENV.FRONTEND_URL}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${ENV.FRONTEND_URL}/dashboard/billing?status=cancelled`,
      metadata: {
        userId,
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout subscription error:", err);
    res.status(500).json({ error: err.message || "Failed to initiate subscription checkout." });
  }
});

export default router;

import { Router, Request, Response } from "express";
import stripe from "../lib/stripe";
import prisma from "../lib/prisma";
import { ENV } from "../config/env";
import Stripe from "stripe";
const router = Router();

/**
 * POST /api/webhooks/stripe
 * Public route to handle Stripe Webhooks.
 * Expects express.raw() body to preserve the original signature verification.
 */
router.post(
  "/",
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      res.status(400).send("Missing stripe-signature header.");
      return;
    }

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        req.body, // This must be a Raw Buffer
        sig,
        ENV.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed:`, err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    console.log(`📡 Stripe Webhook Event Received: ${event.type}`);

    try {
      switch (event.type) {
        // --- SaaS Subscription Billing Events ---
        case "checkout.session.completed": {
          const session = event.data.object;
          
          // Verify if it is a subscription mode checkout session
          if (session.mode === "subscription") {
            const userId = session.metadata?.userId;
            const stripeCustomerId = session.customer as string;

            if (userId) {
              await prisma.user.update({
                where: { id: userId },
                data: {
                  planStatus: "ACTIVE",
                  stripeCustomerId,
                },
              });
              console.log(`✅ Plan activated for user: ${userId}`);
            } else if (stripeCustomerId) {
              // Fallback: look up user by stripe customer ID
              await prisma.user.updateMany({
                where: { stripeCustomerId },
                data: { planStatus: "ACTIVE" },
              });
              console.log(`✅ Plan activated for customer: ${stripeCustomerId}`);
            }
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object;
          const stripeCustomerId = invoice.customer as string;

          if (stripeCustomerId) {
            // Update plan status to active when invoice is successfully paid
            await prisma.user.updateMany({
              where: { stripeCustomerId },
              data: { planStatus: "ACTIVE" },
            });
            console.log(`💰 Invoice paid. Plan set to ACTIVE for customer: ${stripeCustomerId}`);
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object;
          const stripeCustomerId = invoice.customer as string;

          if (stripeCustomerId) {
            await prisma.user.updateMany({
              where: { stripeCustomerId },
              data: { planStatus: "PAST_DUE" },
            });
            console.log(`❌ Invoice payment failed. Plan set to PAST_DUE for customer: ${stripeCustomerId}`);
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const stripeCustomerId = subscription.customer as string;

          if (stripeCustomerId) {
            await prisma.user.updateMany({
              where: { stripeCustomerId },
              data: { planStatus: "FREE" },
            });
            console.log(`😢 Subscription ended. Plan set to FREE for customer: ${stripeCustomerId}`);
          }
          break;
        }

        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (dbErr: any) {
      console.error("Error processing Stripe webhook database update:", dbErr);
      res.status(500).send("Database transaction error.");
    }
  }
);

export default router;

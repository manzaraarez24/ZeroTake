import Stripe from "stripe";
import { ENV } from "../config/env";

if (!ENV.STRIPE_SECRET_KEY) {
  console.warn("⚠️ Warning: STRIPE_SECRET_KEY is not defined in environment variables.");
}

export const stripe = new Stripe(
  ENV.STRIPE_SECRET_KEY || "sk_test_dummy_placeholder_please_configure_stripe_secret_key"
);

export default stripe;

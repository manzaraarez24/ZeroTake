import Razorpay from "razorpay";
import { ENV } from "../config/env";

let _client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!_client) {
    if (!ENV.RAZORPAY_KEY_ID || !ENV.RAZORPAY_KEY_SECRET) {
      throw new Error(
        "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
      );
    }
    _client = new Razorpay({
      key_id: ENV.RAZORPAY_KEY_ID,
      key_secret: ENV.RAZORPAY_KEY_SECRET,
    });
  }
  return _client;
}

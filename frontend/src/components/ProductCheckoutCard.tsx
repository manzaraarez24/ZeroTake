"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { createRazorpayOrder, ApiError } from "@/lib/api";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

interface Props {
  productId: string;
  productTitle: string;
  price: number;
}

export default function ProductCheckoutCard({ productId, productTitle, price }: Props) {
  const searchParams = useSearchParams();
  const paymentDone = searchParams.get("payment") === "success";

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => { scriptLoaded.current = true; };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  async function handleRazorpay() {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!scriptLoaded.current || !window.Razorpay) {
      setError("Payment system is loading. Please try again in a moment.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const order = await createRazorpayOrder(productId, email.trim());

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ZeroTake",
        description: order.productTitle,
        order_id: order.orderId,
        prefill: { email: email.trim() },
        theme: { color: "#10b981" },
        handler: () => {
          window.location.href = `?payment=success`;
        },
        modal: {
          ondismiss: () => setIsLoading(false),
        },
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to initiate payment. Please try again.");
      setIsLoading(false);
    }
  }

  if (paymentDone) {
    return (
      <div className="bg-[#111114] border border-emerald-500/30 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Payment Received!</h2>
        <p className="text-gray-400 text-sm">
          Thank you for your purchase. You&apos;ll receive a download link at your email shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10">
        <div className="text-4xl font-bold text-white mb-1">₹{price.toFixed(2)}</div>
        <div className="text-sm text-emerald-500 font-medium mb-8">One-time payment</div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-[#1a1a1f] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-400">{error}</p>
        )}

        {/* Razorpay button — white bg so logo brand colors show clearly */}
        <button
          onClick={handleRazorpay}
          disabled={isLoading}
          className="w-full bg-white hover:bg-gray-100 text-[#072654] font-bold py-4 rounded-xl transition-all mb-3 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-[#072654]/20 border-t-[#072654] animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="#072654" />
                <path d="M26.5 11L18 22h5.5l-5 8 13-14h-6l5-5h-4z" fill="#3395FF" />
              </svg>
              Pay ₹{price.toFixed(2)} with Razorpay
            </>
          )}
        </button>

        {/* Stripe placeholder — will be wired in Phase 5 */}
        <button
          disabled
          className="w-full bg-[#635BFF]/20 text-[#635BFF]/50 font-bold py-4 rounded-xl mb-4 flex items-center justify-center gap-3 cursor-not-allowed border border-[#635BFF]/10"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
          </svg>
          Pay with Stripe (coming soon)
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4" />
          <span>Secure, encrypted checkout</span>
        </div>
      </div>
    </div>
  );
}

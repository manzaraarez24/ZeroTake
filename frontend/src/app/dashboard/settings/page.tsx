"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  getStripeConnectStatus,
  getStripeConnectOnboardUrl,
  createSubscriptionCheckout,
  createRazorpaySubscription,
  saveRazorpayAccount,
  updateProfile,
  ApiError,
} from '@/lib/api';
import { CheckCircle2, AlertCircle, ExternalLink, Link2, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// Razorpay logo — uses its actual brand colors, safe on any background
function RazorpayLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#072654" />
      <path d="M26.5 11L18 22h5.5l-5 8 13-14h-6l5-5h-4z" fill="#3395FF" />
    </svg>
  );
}

export default function SettingsPage() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();

  const [storeName, setStoreName] = useState(user?.storeName ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  const [stripeStatus, setStripeStatus] = useState<{
    isConnected: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
  } | null>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeConnecting, setStripeConnecting] = useState(false);

  const [rzpKeyId, setRzpKeyId] = useState(user?.razorpayKeyId ?? '');
  const [rzpSaving, setRzpSaving] = useState(false);
  const [rzpMsg, setRzpMsg] = useState('');
  const [rzpError, setRzpError] = useState('');

  const [subLoading, setSubLoading] = useState(false);
  const [rzpSubLoading, setRzpSubLoading] = useState(false);

  const connectResult = searchParams.get('stripe_connect');

  useEffect(() => {
    if (!token) return;
    getStripeConnectStatus(token)
      .then(status => setStripeStatus(status))
      .catch(console.error)
      .finally(() => setStripeLoading(false));
  }, [token, connectResult]);

  // Load Razorpay Checkout JS for subscription payments
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  async function handleSaveProfile(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setSaveMsg('');
    setSaveError('');
    try {
      await updateProfile(token, storeName);
      setSaveMsg('Profile saved!');
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConnectStripe() {
    if (!token) return;
    setStripeConnecting(true);
    try {
      const { url } = await getStripeConnectOnboardUrl(token);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setStripeConnecting(false);
    }
  }

  async function handleSaveRazorpay(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!token) return;
    setRzpSaving(true);
    setRzpMsg('');
    setRzpError('');
    try {
      await saveRazorpayAccount(token, rzpKeyId.trim() || null);
      setRzpMsg('Razorpay account saved!');
    } catch (err) {
      setRzpError(err instanceof ApiError ? err.message : 'Failed to save.');
    } finally {
      setRzpSaving(false);
    }
  }

  async function handleDisconnectRazorpay() {
    if (!token) return;
    setRzpSaving(true);
    setRzpMsg('');
    setRzpError('');
    try {
      await saveRazorpayAccount(token, null);
      setRzpKeyId('');
      setRzpMsg('Razorpay account disconnected.');
    } catch (err) {
      setRzpError(err instanceof ApiError ? err.message : 'Failed to disconnect.');
    } finally {
      setRzpSaving(false);
    }
  }

  async function handleSubscribe() {
    if (!token) return;
    setSubLoading(true);
    try {
      const { url } = await createSubscriptionCheckout(token);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setSubLoading(false);
    }
  }

  async function handleRazorpaySubscribe() {
    if (!token) return;
    setRzpSubLoading(true);
    try {
      const { subscriptionId, keyId } = await createRazorpaySubscription(token);
      const rzp = new (window as any).Razorpay({
        key: keyId,
        subscription_id: subscriptionId,
        name: "ZeroTake",
        description: "Pro Plan — ₹1900/mo",
        theme: { color: "#10b981" },
        handler: () => { window.location.reload(); },
        modal: { ondismiss: () => setRzpSubLoading(false) },
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      setRzpSubLoading(false);
    }
  }

  const storeSlug = storeName.toLowerCase().replace(/\s+/g, '-');
  const isRazorpayConnected = !!(user?.razorpayKeyId || rzpKeyId.trim());

  return (
    <div className="p-10 max-w-[1000px] mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Settings</h1>
        <p className="text-gray-400 text-sm">Manage your account and storefront settings</p>
      </div>

      {/* Stripe Connect return banner */}
      {connectResult === 'success' && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          Stripe account connected successfully! You can now receive payments.
        </div>
      )}
      {connectResult === 'refresh' && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          Stripe onboarding was not completed. Please try connecting again.
        </div>
      )}

      {/* Profile */}
      <form onSubmit={handleSaveProfile} className="bg-[#18181c] border border-white/5 rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-medium text-white mb-6">Profile</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
            <input
              type="text"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              required
              className="w-full max-w-md bg-[#111114] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Store URL</label>
            <div className="flex items-center max-w-md">
              <span className="bg-[#111114] border border-white/10 border-r-0 rounded-l-lg px-4 py-3 text-gray-500 text-sm">
                zerotake.com/
              </span>
              <div className="flex-1 bg-[#111114] border border-white/10 rounded-r-lg px-4 py-3 text-gray-400 text-sm">
                {storeSlug}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full max-w-md bg-[#0d0d10] border border-white/5 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
        {saveMsg && <p className="mt-4 text-sm text-emerald-400">{saveMsg}</p>}
        {saveError && <p className="mt-4 text-sm text-red-400">{saveError}</p>}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Payments */}
      <div className="bg-[#18181c] border border-white/5 rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-medium text-white mb-2">Payments</h2>
        <p className="text-sm text-gray-400 mb-6">Connect a payment account to receive payouts directly from your buyers.</p>

        <div className="space-y-3 max-w-md">
          {/* Stripe Connect */}
          {stripeLoading ? (
            <div className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <div className="flex items-center gap-4 p-4 bg-[#111114] border border-white/10 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-[#635BFF]/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#635BFF]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">Stripe Connect</div>
                {stripeStatus?.isConnected ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Connected · Charges {stripeStatus.chargesEnabled ? 'enabled' : 'pending'}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Not connected</div>
                )}
              </div>
              {stripeStatus?.isConnected ? (
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-lg transition-colors"
                >
                  Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <button
                  onClick={handleConnectStripe}
                  disabled={stripeConnecting}
                  className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {stripeConnecting ? 'Redirecting...' : 'Connect'}
                </button>
              )}
            </div>
          )}

          {/* Razorpay Account */}
          <div className="p-4 bg-[#111114] border border-white/10 rounded-lg">
            <div className="flex items-center gap-4 mb-0">
              <div className="w-10 h-10 rounded-lg bg-[#072654]/60 border border-[#3395FF]/20 flex items-center justify-center shrink-0">
                <RazorpayLogo className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">Razorpay</div>
                {isRazorpayConnected ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Connected
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Not connected</div>
                )}
              </div>
              {isRazorpayConnected && (
                <button
                  type="button"
                  onClick={handleDisconnectRazorpay}
                  disabled={rzpSaving}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-500/20 hover:bg-red-500/5 rounded-lg transition-colors"
                >
                  <X className="w-3 h-3" /> Disconnect
                </button>
              )}
            </div>

            {!isRazorpayConnected && (
              <form onSubmit={handleSaveRazorpay} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Razorpay Key ID <span className="text-gray-600">(from your Razorpay dashboard)</span>
                  </label>
                  <input
                    type="text"
                    value={rzpKeyId}
                    onChange={e => setRzpKeyId(e.target.value)}
                    placeholder="rzp_live_xxxxxxxxxxxx"
                    className="w-full bg-[#1a1a1f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3395FF]/40 transition-colors font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={rzpSaving || !rzpKeyId.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#072654] hover:bg-[#0a3470] text-white text-sm font-medium rounded-lg border border-[#3395FF]/30 hover:border-[#3395FF]/50 transition-colors disabled:opacity-50"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    {rzpSaving ? 'Saving...' : 'Link Account'}
                  </button>
                  <a
                    href="https://dashboard.razorpay.com/app/website-app-settings/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#3395FF] hover:text-blue-300 transition-colors"
                  >
                    Get Key ID ↗
                  </a>
                </div>
              </form>
            )}

            {rzpMsg && <p className="mt-3 text-xs text-emerald-400">{rzpMsg}</p>}
            {rzpError && <p className="mt-3 text-xs text-red-400">{rzpError}</p>}
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-[#18181c] border border-white/5 rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-medium text-white mb-2">Subscription</h2>
        <p className="text-sm text-gray-400 mb-6">Your current plan and billing.</p>

        <div className={`p-4 border rounded-lg max-w-md ${
          user?.planStatus === 'ACTIVE'
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${user?.planStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-gray-300'}`}>
              {user?.planStatus === 'ACTIVE' ? 'Pro — $19/mo' : 'Free'}
            </span>
            {user?.planStatus === 'ACTIVE' && (
              <span className="text-xs text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            )}
          </div>
          {user?.planStatus !== 'ACTIVE' && (
            <>
              <p className="text-xs text-gray-400 mb-4">
                Upgrade to Pro to publish your storefront and start selling with $0 transaction fees.
              </p>
              <div className="flex flex-wrap gap-3">
                {/* Stripe subscription */}
                <button
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#635BFF] hover:bg-[#4F46E5] text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                  </svg>
                  {subLoading ? 'Redirecting...' : 'Pay $19/mo via Stripe'}
                </button>

                {/* Razorpay subscription — white bg so logo is visible */}
                <button
                  onClick={handleRazorpaySubscribe}
                  disabled={rzpSubLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-100 text-[#072654] text-sm font-bold rounded-lg transition-colors disabled:opacity-50 border border-white/20"
                >
                  <RazorpayLogo className="w-5 h-5" />
                  {rzpSubLoading ? 'Processing...' : 'Pay ₹1900/mo via Razorpay'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap } from "lucide-react";
import { Suspense } from "react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error || !token) {
      setStatus("error");
      setTimeout(() => router.replace("/login?error=oauth_failed"), 2000);
      return;
    }

    // Store token the same way the existing auth context does
    localStorage.setItem("zerotake_token", token);
    // Hard navigation so AuthProvider re-mounts and reads the new token
    window.location.href = "/dashboard";
  }, [router, searchParams]);

  if (status === "error") {
    return (
      <div className="text-center">
        <p className="text-red-400 text-sm mb-2">Authentication failed.</p>
        <p className="text-gray-500 text-xs">Redirecting back to login…</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin mx-auto mb-4" />
      <p className="text-sm text-gray-400">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center gap-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-black" fill="currentColor" />
        </div>
        <span className="text-lg font-bold tracking-tight">ZeroTake</span>
      </div>
      <Suspense fallback={<div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}

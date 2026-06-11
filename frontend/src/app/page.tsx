"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap, DollarSign, Activity } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" fill="currentColor" />
          </div>
          <span className="font-semibold text-lg tracking-tight">ZeroTake</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link 
            href="/register" 
            className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            Start for free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-gray-300">The 0% Fee Alternative is Here</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-6xl md:text-8xl font-bold tracking-tighter max-w-4xl"
        >
          Keep <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">100%</span> of your revenue.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-xl text-gray-400 max-w-2xl"
        >
          Stop giving away your hard-earned money. Sell digital products directly to your audience for a flat $19/mo. We take 0% of your sales.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link 
            href="/register" 
            className="flex items-center gap-2 bg-emerald-500 text-black font-medium px-8 py-4 rounded-full hover:bg-emerald-400 transition-colors shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            href="#features" 
            className="flex items-center gap-2 bg-white/5 text-white font-medium px-8 py-4 rounded-full border border-white/10 hover:bg-white/10 transition-colors"
          >
            Compare to Gumroad
          </Link>
        </motion.div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 px-6 border-t border-white/5 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<DollarSign />}
              title="$0 Transaction Fees"
              description="You only pay a flat $19/mo subscription. Whether you make $100 or $100k, we never take a cut."
            />
            <FeatureCard 
              icon={<Zap />}
              title="Instant Payouts"
              description="Connect your own Stripe account. Money goes directly to you when a customer makes a purchase."
            />
            <FeatureCard 
              icon={<Activity />}
              title="Beautiful Storefronts"
              description="High-converting checkout pages and storefronts that reflect your premium brand."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-emerald-500/30 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

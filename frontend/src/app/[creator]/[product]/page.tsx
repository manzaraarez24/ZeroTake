import { ArrowLeft, Check, Zap } from 'lucide-react';
import Link from 'next/link';
import { getStorefront } from '@/lib/api';
import ProductCheckoutCard from '@/components/ProductCheckoutCard';
import ChatWidget from '@/components/ChatWidget';
import { Suspense } from 'react';

export default async function ProductCheckoutPage({
  params,
}: {
  params: Promise<{ creator: string; product: string }>;
}) {
  const { creator: creatorSlug, product: productId } = await params;

  let creator;
  let product;

  try {
    const data = await getStorefront(creatorSlug);
    creator = data.creator;
    product = creator.products.find(p => p.id === productId);
  } catch {
    // handled below
  }

  if (!creator || !product) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3">Product not found</h1>
          <p className="text-gray-400 mb-6">This product doesn&apos;t exist or is no longer available.</p>
          <Link href={`/${creatorSlug}`} className="text-emerald-500 hover:text-emerald-400 transition-colors">
            ← Back to store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href={`/${creatorSlug}`}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {creator.storeName}&apos;s Store
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-800 flex items-center justify-center text-[10px] font-bold text-black">
              {creator.storeName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium">{creator.storeName}</span>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-12 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left: Product Details */}
          <div>
            <div className="aspect-[4/3] bg-[#111114] border border-white/5 rounded-2xl mb-8 flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-50" />
              <Zap className="w-16 h-16 text-emerald-500/20" />
            </div>

            <h1 className="text-4xl font-bold tracking-tight mb-4">{product.title}</h1>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">{product.description}</p>

            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">What&apos;s Included</h3>
              {['Instant digital download', 'Secure file delivery', 'Lifetime access'].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Checkout Card */}
          <div className="lg:sticky lg:top-12">
            <Suspense fallback={<div className="bg-[#111114] border border-white/10 rounded-2xl p-8 h-64 animate-pulse" />}>
              <ProductCheckoutCard
                productId={product.id}
                productTitle={product.title}
                price={product.price}
              />
            </Suspense>
          </div>

        </div>
      </main>

      {product.aiChatEnabled && (
        <ChatWidget productId={product.id} productTitle={product.title} />
      )}
    </div>
  );
}

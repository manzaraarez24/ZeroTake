import { ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { getStorefront } from '@/lib/api';

export default async function CreatorStorefront({ params }: { params: Promise<{ creator: string }> }) {
  const { creator: creatorSlug } = await params;

  let creator;
  try {
    const data = await getStorefront(creatorSlug);
    creator = data.creator;
  } catch {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3">Store not found</h1>
          <p className="text-gray-400">No storefront exists at this URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30">
      {/* Store Header */}
      <header className="border-b border-white/5 bg-[#050505]">
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-800 p-1 mb-6">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-3xl font-bold">
              {creator.storeName.charAt(0).toUpperCase()}
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">{creator.storeName}</h1>
          <p className="text-gray-400 max-w-lg mb-6">
            Welcome to my digital storefront. Browse and purchase premium digital products.
          </p>
        </div>
      </header>

      {/* Products Grid */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">All Products</h2>
          <div className="text-sm text-gray-500">{creator.products.length} item{creator.products.length !== 1 ? 's' : ''}</div>
        </div>

        {creator.products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-white font-medium mb-1">No products yet</h3>
            <p className="text-sm text-gray-400">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creator.products.map(product => {
              return (
                <Link
                  key={product.id}
                  href={`/${creatorSlug}/${product.id}`}
                  className="group flex flex-col bg-[#111114] border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/30 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] transition-all"
                >
                  <div className="aspect-[4/3] bg-[#1a1a1f] relative overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <ShoppingBag className="w-12 h-12 text-white/10 z-0" />
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6 line-clamp-2">{product.description}</p>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-bold text-white">${product.price.toFixed(2)}</span>
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-8 text-center">
        <p className="text-sm text-gray-600">
          Powered by <span className="font-semibold text-white tracking-tight">ZeroTake</span>
        </p>
      </footer>
    </div>
  );
}

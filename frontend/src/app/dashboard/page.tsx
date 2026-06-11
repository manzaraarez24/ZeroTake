"use client";

import { useEffect, useState } from 'react';
import { Plus, Settings, Box, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { listProducts, type Product } from '@/lib/api';

export default function Dashboard() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    listProducts(token)
      .then(({ products }) => setProducts(products))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  const published = products.filter(p => p.isPublished);
  const totalOrders = products.reduce((sum, p) => sum + (p._count?.orders ?? 0), 0);
  const recentProducts = products.slice(0, 3);

  return (
    <div className="p-10 max-w-[1200px] mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Dashboard</h1>
        <p className="text-gray-400 text-sm">Your digital storefront overview</p>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Products</h2>
          <Link href="/dashboard/products" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-[#24252a] border border-white/5 rounded-xl p-5 h-[180px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProducts.map(product => (
              <Link
                key={product.id}
                href={`/dashboard/products/${product.id}`}
                className="bg-[#24252a] border border-white/5 rounded-xl p-5 hover:border-white/20 transition-all group block"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    {product.isPublished ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        <span className="text-emerald-500 text-xs font-medium uppercase tracking-wider">Active</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-gray-500" />
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Draft</span>
                      </>
                    )}
                  </div>
                  <button className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg text-white font-medium mb-1 line-clamp-1">{product.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>

                <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="px-2 py-1 bg-white/5 border border-white/5 rounded-md">
                    {product._count?.orders ?? 0} sales
                  </span>
                </div>
              </Link>
            ))}

            <Link
              href="/dashboard/products/new"
              className="border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-8 hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer group min-h-[180px]"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-emerald-500 transition-all">
                <Plus className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Add Product</span>
            </Link>
          </div>
        )}
      </div>

      {/* Stats / Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Sales</h2>
          </div>
          <div className="bg-[#18181c] border border-white/5 rounded-xl overflow-hidden shadow-sm">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Box className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="text-white font-medium mb-1">No sales yet</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Once you start making sales, they will appear here.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Overview</h2>
          </div>
          <div className="bg-[#18181c] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-white">$0.00</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-gray-400">Total Orders</span>
                <span className="text-sm font-medium text-white">{totalOrders}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-gray-400">Active Products</span>
                <span className="text-sm font-medium text-white">{published.length}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">Total Products</span>
                <span className="text-sm font-medium text-white">{products.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

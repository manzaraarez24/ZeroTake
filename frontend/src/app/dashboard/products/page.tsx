"use client";

import { useEffect, useState } from 'react';
import { Plus, Search, MoreHorizontal, PackageOpen, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { listProducts, deleteProduct, type Product } from '@/lib/api';

export default function ProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listProducts(token)
      .then(({ products }) => setProducts(products))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  async function handleDelete(id: string) {
    if (!token) return;
    setDeleting(id);
    try {
      await deleteProduct(token, id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
      setOpenMenu(null);
    }
  }

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-10 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Products</h1>
          <p className="text-gray-400 text-sm">Manage your digital products and pricing</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Product
        </Link>
      </div>

      <div className="bg-[#18181c] border border-white/5 rounded-xl shadow-sm">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#111114] border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="divide-y divide-white/5">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/5 rounded animate-pulse w-48" />
                  <div className="h-2 bg-white/5 rounded animate-pulse w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <PackageOpen className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-white font-medium mb-1">
              {search ? 'No products match your search' : 'No products yet'}
            </h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
              {search ? 'Try a different search term.' : 'Create your first product to start selling.'}
            </p>
            {!search && (
              <Link
                href="/dashboard/products/new"
                className="flex items-center gap-2 bg-emerald-500 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Product
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(product => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    product.isPublished
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-white/5 border border-white/10'
                  }`}>
                    <PackageOpen className={`w-5 h-5 ${product.isPublished ? 'text-emerald-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-medium text-sm mb-1 truncate">{product.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${product.isPublished ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                        {product.isPublished ? 'Active' : 'Draft'}
                      </span>
                      <span>•</span>
                      <span>{product._count?.orders ?? 0} sales</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">${product.price.toFixed(2)}</div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === product.id ? null : product.id)}
                      className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openMenu === product.id && (
                      <div className="absolute right-0 top-full mt-1 bg-[#24252a] border border-white/10 rounded-lg shadow-xl z-10 w-44 py-1">
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                          onClick={() => setOpenMenu(null)}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deleting === product.id}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deleting === product.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

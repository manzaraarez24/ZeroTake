"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  LifeBuoy,
  Bell,
  ChevronDown,
  Zap,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  function handleLogout() {
    logout();
    router.push('/');
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#1b1b1f] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const storeSlug = user.storeName.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex min-h-screen bg-[#1b1b1f] text-gray-300 font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#141417] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 text-black" fill="currentColor" />
          </div>
          <span className="font-semibold text-white tracking-tight">ZeroTake</span>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8">
          {/* Store Switcher */}
          <div>
            <div className="text-[10px] font-semibold text-gray-500 mb-2 px-1 uppercase tracking-widest">
              Current Store
            </div>
            <Link
              href={`/${storeSlug}`}
              target="_blank"
              className="bg-[#24252a] text-white px-3 py-2 rounded-lg flex items-center justify-between text-sm cursor-pointer border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-4 h-4 rounded-md bg-emerald-500 shrink-0" />
                <span className="font-medium truncate">{user.storeName}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            </Link>
          </div>

          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    active
                      ? 'text-white bg-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 space-y-1">
          <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors cursor-pointer">
            <div className="flex items-center gap-3 font-medium">
              <Bell className="w-4 h-4" />
              Notifications
            </div>
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
              0
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors cursor-pointer">
            <LifeBuoy className="w-4 h-4" />
            Support
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="px-3 py-2 mb-2">
              <div className="text-xs font-medium text-white truncate">{user.storeName}</div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Link from 'next/link';
import { LayoutDashboard, Store, LineChart, BookOpen, Activity, TerminalSquare, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'customer') {
        router.push('/customer');
      } else if (typeof window !== 'undefined' && localStorage.getItem('admin_view_mode') === 'customer') {
        router.push('/customer');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-400 font-medium text-sm">Validating session...</span>
        </div>
      </div>
    );
  }

  const handleSignout = async () => {
    await logout();
    router.push('/login');
  };

  const navLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Restaurants', href: '/admin/restaurants', icon: Store },
    { name: 'KPIs & Insights', href: '/admin/kpis', icon: LineChart },
    { name: 'Architecture', href: '/admin/architecture', icon: BookOpen },
    { name: 'Monitoring', href: '/admin/monitoring', icon: Activity },
    { name: 'Live Logs', href: '/admin/logs', icon: TerminalSquare },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950 flex flex-col justify-between shrink-0 z-20 shadow-2xl shadow-indigo-900/10 relative">
        <div>
          <div className="h-20 flex items-center px-8 border-b border-slate-900/80">
            <span className="text-2xl font-black text-indigo-500 tracking-tighter flex items-center gap-2">
              iFood <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Admin</span>
            </span>
          </div>
          <nav className="p-4 space-y-1.5 mt-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold cursor-pointer group ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600/20 to-transparent text-indigo-400 border border-indigo-500/20 shadow-[inset_2px_0_0_0_rgba(99,102,241,1)]' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent hover:border-slate-800/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-indigo-400 scale-110' : 'text-slate-500 group-hover:scale-110 group-hover:text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-900/80 bg-gradient-to-t from-slate-950 to-transparent">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/40 rounded-2xl border border-slate-800/60 shadow-inner mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shadow-sm shrink-0">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}&backgroundColor=transparent`} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-slate-200 text-xs font-bold truncate" title={user.email}>{user.email}</span>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Administrator</span>
            </div>
          </div>
          <button
            onClick={handleSignout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-transparent hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-slate-500 hover:text-red-400 rounded-xl transition-all text-xs font-bold cursor-pointer group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 relative">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] pointer-events-none rounded-full transform translate-x-1/3 -translate-y-1/3" />
        
        <div className="flex-1 overflow-y-auto relative z-10 p-8 md:p-12 animate-fade-in custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

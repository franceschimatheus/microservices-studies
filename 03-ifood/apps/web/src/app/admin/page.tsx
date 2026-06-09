'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navbar } from '@/features/auth/components/Navbar';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'customer') {
        router.push('/customer');
      } else if (user.role === 'admin' && typeof window !== 'undefined' && localStorage.getItem('admin_view_mode') === 'customer') {
        router.push('/customer');
      }
    }
  }, [user, loading, router]);

  const switchToCustomerView = () => {
    localStorage.setItem('admin_view_mode', 'customer');
    router.push('/customer');
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      <Navbar email={user.email} role={user.role} onLogout={logout} />

      <main className="flex-1 p-10 max-w-7xl w-full mx-auto">
        <div className="bg-gradient-to-r from-indigo-950/20 to-slate-950 border border-slate-800 rounded-3xl p-10 mb-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
              Admin Management Console 🛡️
            </h1>
            <p className="text-slate-400 text-lg">
              Manage system services, inspect restaurant configurations, monitor order topics, and track platform metrics.
            </p>
          </div>
          <button 
            onClick={switchToCustomerView}
            className="shrink-0 bg-red-600 border border-red-650 text-white text-sm font-bold py-3.5 px-6 rounded-2xl hover:bg-red-700 hover:border-red-700 transition-all cursor-pointer shadow-lg"
          >
            Buy Products (Customer View) 🛒
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Restaurant & Menu Control */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/60 flex flex-col justify-between shadow-lg">
            <div>
              <div className="text-3xl mb-4">🍔</div>
              <h3 className="text-xl font-bold mb-2 text-indigo-300">Restaurant & Menu Control</h3>
              <p className="text-slate-300 text-xs mb-6 leading-relaxed">
                Add and edit restaurants, define categories, and control menus/items with full availability toggling.
              </p>
            </div>
            <Link 
              href="/admin/restaurants" 
              className="inline-block bg-indigo-650 border border-indigo-600 text-white text-xs font-semibold py-2.5 px-5 rounded-lg hover:bg-indigo-700 hover:border-indigo-700 transition-all text-center self-start"
            >
              Control Restaurants & Menus 🛠️
            </Link>
          </div>

          {/* Card 2: KPIs & Insights */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/60 flex flex-col justify-between shadow-lg">
            <div>
              <div className="text-3xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-2 text-indigo-300">KPIs & Insights</h3>
              <p className="text-slate-300 text-xs mb-6 leading-relaxed">
                Analyze total orders, platform revenues, delivery latency, and payment success rates in real-time.
              </p>
            </div>
            <Link 
              href="/admin/kpis" 
              className="inline-block bg-indigo-650 border border-indigo-600 text-white text-xs font-semibold py-2.5 px-5 rounded-lg hover:bg-indigo-700 hover:border-indigo-700 transition-all text-center self-start"
            >
              View Performance KPIs 🚀
            </Link>
          </div>

          {/* Card 3: Infra & Monitoring */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/60 flex flex-col justify-between shadow-lg">
            <div>
              <div className="text-3xl mb-4">🖥️</div>
              <h3 className="text-xl font-bold mb-2 text-indigo-300">Infra & Monitoring</h3>
              <p className="text-slate-300 text-xs mb-6 leading-relaxed">
                Direct links to raw metrics servers, distributed tracing dashboards, message brokers, and logs.
              </p>
            </div>
            <Link 
              href="/admin/monitoring" 
              className="inline-block bg-indigo-650 border border-indigo-600 text-white text-xs font-semibold py-2.5 px-5 rounded-lg hover:bg-indigo-700 hover:border-indigo-700 transition-all text-center self-start"
            >
              Open Monitoring Panels 🖥️
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

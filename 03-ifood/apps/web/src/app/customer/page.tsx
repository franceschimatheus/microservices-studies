'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navbar } from '@/features/auth/components/Navbar';

export default function CustomerDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'customer') {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-10 mb-8 shadow-xl">
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
            Welcome back, <span className="text-red-500">{user.email.split('@')[0]}</span>! 👋
          </h1>
          <p className="text-slate-400 text-lg">
            Hungry? Explore local restaurants, order meals, and track your delivery in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-red-500/20">
            <h3 className="text-xl font-bold mb-3">Restaurants</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Browse active menus, filter by category, and customize your orders.
            </p>
            <button className="bg-slate-850 border border-slate-800 text-white font-semibold py-3 px-6 rounded-xl hover:bg-red-600 hover:border-red-600 transition-all cursor-pointer">
              Explore Menu
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-red-500/20">
            <h3 className="text-xl font-bold mb-3">Your Orders</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              You have no active orders currently. Track your history or order something new!
            </p>
            <button disabled className="bg-slate-850 border border-slate-800 text-slate-500 font-semibold py-3 px-6 rounded-xl cursor-not-allowed opacity-50">
              Track Status
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

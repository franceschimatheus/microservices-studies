'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navbar } from '@/features/auth/components/Navbar';

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'customer') {
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      <Navbar email={user.email} role={user.role} onLogout={logout} />

      <main className="flex-1 p-10 max-w-7xl w-full mx-auto">
        <div className="bg-gradient-to-r from-indigo-950/20 to-slate-950 border border-slate-800 rounded-3xl p-10 mb-8 shadow-xl">
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
            Admin Management Console 🛡️
          </h1>
          <p className="text-slate-400 text-lg">
            Manage system services, inspect restaurant configurations, monitor order topics, and track platform metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/20">
            <h3 className="text-lg font-bold mb-2">Service Status</h3>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              Monitor active microservice nodes, trace latency distributions, and view memory allocation rates.
            </p>
            <button className="bg-slate-850 border border-slate-800 text-white text-xs font-semibold py-2.5 px-5 rounded-lg hover:bg-indigo-600 hover:border-indigo-600 transition-all cursor-pointer">
              Open Grafana
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/20">
            <h3 className="text-lg font-bold mb-2">Database Migrations</h3>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              Verify schema migration histories, manage outbox tables, and review Postgres connection pools.
            </p>
            <button className="bg-slate-850 border border-slate-800 text-white text-xs font-semibold py-2.5 px-5 rounded-lg hover:bg-indigo-600 hover:border-indigo-600 transition-all cursor-pointer">
              Run Migrator
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/20">
            <h3 className="text-lg font-bold mb-2">User Directory</h3>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              Manage platform credentials, reset tokens, assign role credentials, and trace user session states.
            </p>
            <button className="bg-slate-850 border border-slate-800 text-white text-xs font-semibold py-2.5 px-5 rounded-lg hover:bg-indigo-600 hover:border-indigo-600 transition-all cursor-pointer">
              View Directory
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

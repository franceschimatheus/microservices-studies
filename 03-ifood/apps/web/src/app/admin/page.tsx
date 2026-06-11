'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const switchToCustomerView = () => {
    localStorage.setItem('admin_view_mode', 'customer');
    router.push('/customer');
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    setIsResetting(true);
    try {
      const res = await fetch('http://localhost:8085/admin/reset-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset system');
      }

      toast('System reset and seeded successfully!', 'success', 'System Reset');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'An error occurred during reset.', 'error', 'Reset Failed');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-900/60 rounded-3xl p-10 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] pointer-events-none rounded-full transform translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-white flex items-center gap-3">
            Admin Management Console 🛡️
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
            Manage system services, inspect restaurant configurations, monitor order topics, and track platform metrics in real-time.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 shrink-0 relative z-10 w-full lg:w-auto">
          <button 
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting}
            className="shrink-0 bg-slate-950/50 border border-red-900/60 hover:bg-red-500/10 text-red-400 disabled:opacity-50 text-sm font-bold py-3.5 px-6 rounded-2xl transition-all cursor-pointer shadow-lg w-full sm:w-auto text-center"
          >
            {isResetting ? 'Resetting System... 🔄' : 'Reset System & Seed ⚠️'}
          </button>
          <button 
            onClick={switchToCustomerView}
            className="shrink-0 bg-gradient-to-r from-indigo-600 to-indigo-500 border border-indigo-500 text-white text-sm font-bold py-3.5 px-6 rounded-2xl hover:from-indigo-500 hover:to-indigo-400 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer shadow-lg w-full sm:w-auto text-center flex items-center justify-center gap-2"
          >
            Switch to Customer View 🛒
          </button>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Restaurant & Menu Control */}
        <Link 
          href="/admin/restaurants"
          className="group bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 hover:-translate-y-1.5 transition-all duration-300 hover:border-indigo-500/50 hover:bg-slate-900/80 hover:shadow-[0_10px_30px_-10px_rgba(99,102,241,0.2)] flex flex-col justify-between"
        >
          <div>
            <div className="text-4xl mb-5 group-hover:scale-110 transition-transform origin-left">🍔</div>
            <h3 className="text-xl font-bold mb-3 text-indigo-300 group-hover:text-indigo-200 transition-colors">Restaurant & Menu Control</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Add and edit restaurants, define categories, and control menus/items with full availability toggling.
            </p>
          </div>
          <div className="text-indigo-400 text-sm font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
            Manage Restaurants <span className="text-lg">→</span>
          </div>
        </Link>

        {/* Card 2: KPIs & Insights */}
        <Link 
          href="/admin/kpis"
          className="group bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 hover:-translate-y-1.5 transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-900/80 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.2)] flex flex-col justify-between"
        >
          <div>
            <div className="text-4xl mb-5 group-hover:scale-110 transition-transform origin-left">📈</div>
            <h3 className="text-xl font-bold mb-3 text-emerald-400 group-hover:text-emerald-300 transition-colors">KPIs & Insights</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Analyze total orders, platform revenues, delivery latency, and payment success rates in real-time.
            </p>
          </div>
          <div className="text-emerald-400 text-sm font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
            View Performance <span className="text-lg">→</span>
          </div>
        </Link>

        {/* Card 3: Infra & Monitoring */}
        <Link 
          href="/admin/monitoring"
          className="group bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 hover:-translate-y-1.5 transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-900/80 hover:shadow-[0_10px_30px_-10px_rgba(6,182,212,0.2)] flex flex-col justify-between"
        >
          <div>
            <div className="text-4xl mb-5 group-hover:scale-110 transition-transform origin-left">🖥️</div>
            <h3 className="text-xl font-bold mb-3 text-cyan-400 group-hover:text-cyan-300 transition-colors">Infra & Monitoring</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Direct links to raw metrics servers, distributed tracing dashboards, message brokers, and logs.
            </p>
          </div>
          <div className="text-cyan-400 text-sm font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
            Open Panels <span className="text-lg">→</span>
          </div>
        </Link>
      </div>

      {/* Reset System Confirm Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="Reset Entire System?"
        message="This will clear all orders, carts, analytics events, OpenSearch indexes, and restore 2 default restaurants. This action cannot be undone."
        confirmLabel="Reset & Seed"
        cancelLabel="Cancel"
        variant="danger"
        loading={isResetting}
      />
    </div>
  );
}

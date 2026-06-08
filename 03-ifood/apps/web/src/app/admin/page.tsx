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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/20 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-2">Service Metrics (Grafana)</h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Monitor active microservice nodes, trace latency distributions, and view memory allocation rates.
              </p>
            </div>
            <a 
              href="http://localhost:3001" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-indigo-600 border border-indigo-600 text-white text-xs font-semibold py-2.5 px-5 rounded-lg hover:bg-indigo-700 hover:border-indigo-700 transition-all text-center self-start"
            >
              Open Grafana 📊
            </a>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/20 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-2">Distributed Tracing (Jaeger)</h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Trace transaction flows and request propagation paths across microservice boundaries.
              </p>
            </div>
            <a 
              href="http://localhost:16686" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-slate-850 border border-slate-800 text-white text-xs font-semibold py-2.5 px-5 rounded-lg hover:bg-indigo-600 hover:border-indigo-600 transition-all text-center self-start"
            >
              Open Jaeger 🕸️
            </a>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/20 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-2">Message Broker (RabbitMQ)</h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Inspect message exchanges, queue depths, subscriber bindings, and track event throughput.
              </p>
            </div>
            <a 
              href="http://localhost:15672" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-slate-850 border border-slate-800 text-white text-xs font-semibold py-2.5 px-5 rounded-lg hover:bg-indigo-600 hover:border-indigo-600 transition-all text-center self-start"
            >
              Open RabbitMQ 🐇
            </a>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/20 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-2">Raw Metrics (Prometheus)</h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Query Prometheus time-series metrics directly or inspect raw service endpoints.
              </p>
            </div>
            <div className="flex gap-2.5">
              <a 
                href="http://localhost:9090" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-slate-850 border border-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-lg hover:bg-indigo-600 hover:border-indigo-600 transition-all text-center"
              >
                Prometheus
              </a>
              <a 
                href="http://localhost:8085/metrics" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-slate-850 border border-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-lg hover:bg-indigo-600 hover:border-indigo-600 transition-all text-center"
              >
                Gateway Metrics
              </a>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/20 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-2">Cache Store (Redis View)</h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Inspect key-value pairs, cache expirations, and trace session/cart data states.
              </p>
            </div>
            <a 
              href="http://localhost:5540" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-slate-850 border border-slate-800 text-white text-xs font-semibold py-2.5 px-5 rounded-lg hover:bg-indigo-600 hover:border-indigo-600 transition-all text-center self-start"
            >
              Open Redis Insight 💾
            </a>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/20 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-2">Search Projection DB</h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Browse indexed restaurants and menu items, query projections, and manage index settings.
              </p>
            </div>
            <a 
              href="http://localhost:5601" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-slate-850 border border-slate-800 text-white text-xs font-semibold py-2.5 px-5 rounded-lg hover:bg-indigo-600 hover:border-indigo-600 transition-all text-center self-start"
            >
              Open OpenSearch Dashboards 🔍
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

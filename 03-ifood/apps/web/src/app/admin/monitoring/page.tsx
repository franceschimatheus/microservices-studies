'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navbar } from '@/features/auth/components/Navbar';
import Link from 'next/link';

export default function AdminMonitoringPage() {
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

  const monitoringTools = [
    {
      name: "Service Metrics (Grafana)",
      emoji: "📊",
      description: "Monitor active microservice nodes, trace latency distributions, and view memory allocation rates.",
      url: "http://localhost:3001",
      badge: "Grafana",
      borderColor: "hover:border-orange-500/40",
      badgeColor: "bg-orange-500/10 text-orange-400",
    },
    {
      name: "Distributed Tracing (Jaeger)",
      emoji: "🕸️",
      description: "Trace transaction flows and request propagation paths across microservice boundaries.",
      url: "http://localhost:16686",
      badge: "Jaeger",
      borderColor: "hover:border-blue-500/40",
      badgeColor: "bg-blue-500/10 text-blue-400",
    },
    {
      name: "Message Broker (RabbitMQ)",
      emoji: "🐇",
      description: "Inspect message exchanges, queue depths, subscriber bindings, and track event throughput.",
      url: "http://localhost:15672",
      badge: "RabbitMQ",
      borderColor: "hover:border-amber-600/40",
      badgeColor: "bg-amber-600/10 text-amber-500",
    },
    {
      name: "Raw Metrics (Prometheus)",
      emoji: "🔥",
      description: "Query Prometheus time-series metrics directly or inspect raw service endpoints.",
      url: "http://localhost:9090",
      badge: "Prometheus",
      borderColor: "hover:border-red-500/40",
      badgeColor: "bg-red-500/10 text-red-400",
    },
    {
      name: "Cache Store (Redis View)",
      emoji: "💾",
      description: "Inspect key-value pairs, cache expirations, and trace session/cart data states.",
      url: "http://localhost:5540",
      badge: "Redis Insight",
      borderColor: "hover:border-rose-500/40",
      badgeColor: "bg-rose-500/10 text-rose-400",
    },
    {
      name: "Search Projection DB",
      emoji: "🔍",
      description: "Browse indexed restaurants and menu items, query projections, and manage index settings.",
      url: "http://localhost:5601",
      badge: "OpenSearch Dashboards",
      borderColor: "hover:border-teal-500/40",
      badgeColor: "bg-teal-500/10 text-teal-400",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      <Navbar email={user.email} role={user.role} onLogout={logout} />

      <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto flex flex-col gap-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
          <div>
            <Link 
              href="/admin"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-1.5 cursor-pointer mb-2 transition-all"
            >
              ← Back to Main Console
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                Infrastructure & Monitoring
              </h1>
              <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" title="Monitoring servers active"></span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Direct telemetry links, diagnostic logs, and message queues in our distributed cluster.
            </p>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monitoringTools.map((tool) => (
            <div 
              key={tool.name}
              className={`bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 ${tool.borderColor} rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-xl group`}
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className={`text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full ${tool.badgeColor}`}>
                    {tool.badge}
                  </span>
                  <span className="text-2xl group-hover:scale-110 transition-transform">{tool.emoji}</span>
                </div>
                <h3 className="text-slate-100 text-lg font-bold mb-2 group-hover:text-indigo-300 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">
                  {tool.description}
                </p>
              </div>

              <a 
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-slate-950 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 text-slate-200 hover:text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-all text-center self-start"
              >
                Open Dashboard →
              </a>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}

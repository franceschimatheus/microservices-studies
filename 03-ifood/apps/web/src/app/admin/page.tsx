'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useServiceStatusesQuery } from '@/features/architecture/queries/useServiceStatusesQuery';
import { useKPIs } from '@/features/analytics/hooks/useKPIs';
import { _get, _post } from '@/services/api';
import { 
  Zap, 
  Activity, 
  ArrowRight,
  Server,
  Play,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

const CORE_SERVICES = [
  { name: 'gateway', label: 'API Gateway', icon: '🚪' },
  { name: 'auth-service', label: 'Auth Service', icon: '🛡️' },
  { name: 'restaurant-service', label: 'Restaurant', icon: '🍔' },
  { name: 'order-service', label: 'Orders', icon: '📦' },
  { name: 'payment-service', label: 'Payments', icon: '💳' },
  { name: 'delivery-service', label: 'Delivery', icon: '⚡' },
  { name: 'analytics-service', label: 'Analytics', icon: '📈' },
  { name: 'notification-service', label: 'Notifications', icon: '🔔' },
  { name: 'search-service', label: 'Search Index', icon: '🔍' },
  { name: 'rabbitmq', label: 'RabbitMQ', icon: '🐇' },
  { name: 'redis', label: 'Redis Cache', icon: '🔴' },
];

const SIMULATION_ENDPOINTS = {
  sim500: { url: '/debug/500', method: 'GET', label: 'HTTP 500 Error' },
  simDLQ: { url: '/debug/dlq', method: 'POST', label: 'RabbitMQ DLQ Event' },
};

export default function AdminDashboard() {
  const router = useRouter();
  const { data: statuses = {} } = useServiceStatusesQuery();
  const { kpis, loading: kpisLoading } = useKPIs();
  const [triggerResult, setTriggerResult] = useState<{ label: string; status: number; text: string; time: string } | null>(null);

  const simulateMutation = useMutation({
    mutationFn: async (id: keyof typeof SIMULATION_ENDPOINTS) => {
      const endpoint = SIMULATION_ENDPOINTS[id];
      const start = Date.now();
      try {
        const response = endpoint.method === 'POST' ? await _post(endpoint.url) : await _get(endpoint.url);
        const data = await response.json();
        const time = `${Date.now() - start}ms`;
        return { label: endpoint.label, status: response.status, text: JSON.stringify(data, null, 2), time };
      } catch (error) {
        const time = `${Date.now() - start}ms`;
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { label: endpoint.label, status: 500, text: message, time };
      }
    },
    onSuccess: (data) => {
      setTriggerResult(data);
    }
  });

  const handleTrigger = (id: keyof typeof SIMULATION_ENDPOINTS) => {
    simulateMutation.mutate(id);
  };

  const switchToCustomerView = () => {
    localStorage.setItem('admin_view_mode', 'customer');
    router.push('/customer');
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-900/40 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] pointer-events-none rounded-full transform translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full mb-3 inline-block">
            Systems Management Dashboard
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Command Center 🛡️
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
            Consolidated controller for the Go microservices monorepo. Monitor real-time RabbitMQ event logs, view ingestion stats, inject test failures, and switch to consumer views.
          </p>
        </div>
        <div className="flex gap-3 shrink-0 relative z-10 w-full md:w-auto">
          <button 
            onClick={switchToCustomerView}
            className="w-full md:w-auto shrink-0 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-white text-xs font-bold py-3 px-5 rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/20 text-center flex items-center justify-center gap-2"
          >
            Switch to Customer View 🛒
          </button>
        </div>
      </div>

      {/* KPI Stats Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-500/20 transition-all">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold mb-2">
            <span>TOTAL ORDERS</span>
            <span>📦</span>
          </div>
          <span className="text-2xl font-black text-white">
            {kpisLoading ? '...' : (kpis?.total_orders ?? 0)}
          </span>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/20 transition-all">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold mb-2">
            <span>REVENUE</span>
            <span>💰</span>
          </div>
          <span className="text-2xl font-black text-emerald-400">
            {kpisLoading ? '...' : `$${(kpis?.total_revenue ?? 0.00).toFixed(2)}`}
          </span>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-500/20 transition-all">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold mb-2">
            <span>PAYMENT SUCCESS</span>
            <span>🔒</span>
          </div>
          <span className="text-2xl font-black text-white">
            {kpisLoading ? '...' : `${(kpis?.payment_success_rate ?? 0).toFixed(1)}%`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle: Live Service Health & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Live Service Health Grid */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-200 text-base">Service Mesh Topology Health</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Monitoring
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CORE_SERVICES.map((svc) => {
                const isOnline = statuses[svc.name] === 'running';
                return (
                  <div 
                    key={svc.name} 
                    className="p-3 bg-slate-950/60 border border-slate-900/80 rounded-xl flex items-center justify-between hover:border-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-sm shrink-0">{svc.icon}</span>
                      <span className="text-xs font-semibold text-slate-300 truncate">{svc.label}</span>
                    </div>
                    <span 
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                      }`}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 flex justify-end">
              <Link 
                href="/admin/configs" 
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
              >
                Simulate Outages (Container Controls) 
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Quick Chaos Injector Panel */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-200 text-base">Quick Chaos Injector</h3>
            </div>
            <p className="text-slate-400 text-xs mb-5">
              Inject intentional runtime errors to trace propagation through the event broker or check gateway resiliency.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleTrigger('sim500')}
                disabled={simulateMutation.isPending}
                className="flex-1 py-3 px-4 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                Inject HTTP 500 Error
              </button>
              <button
                onClick={() => handleTrigger('simDLQ')}
                disabled={simulateMutation.isPending}
                className="flex-1 py-3 px-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                Trigger RabbitMQ DLQ Message
              </button>
            </div>

            {triggerResult && (
              <div className="mt-4 p-4 bg-slate-950 border border-slate-900 rounded-xl font-mono text-[10px] text-slate-400 space-y-2 animate-fadeIn relative">
                <div className="flex justify-between items-center text-slate-500 border-b border-slate-900 pb-1.5">
                  <span className="font-semibold text-slate-400">{triggerResult.label}</span>
                  <span>HTTP {triggerResult.status} ({triggerResult.time})</span>
                </div>
                <pre className="overflow-x-auto max-h-36 custom-scrollbar whitespace-pre-wrap">{triggerResult.text}</pre>
                <div className="text-[9px] text-indigo-400/80">
                  💡 Go to the <Link href="/admin/logs" className="underline font-bold text-indigo-400">Live Event Stream</Link> tab to see the system reactions.
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right side: External Telemetry & Architecture Quick Links */}
        <div className="space-y-6">
          {/* Telemetry Center Shortcuts */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-200 text-base">Telemetry Center</h3>
            </div>

            <div className="space-y-3">
              <a 
                href="http://localhost:3001" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-900/85 hover:border-orange-500/40 rounded-xl group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">📊</span>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">Grafana Dashboards</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-orange-400 transition-colors">Launch →</span>
              </a>

              <a 
                href="http://localhost:16686" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-900/85 hover:border-blue-500/40 rounded-xl group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🕸️</span>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">Jaeger Distributed Tracing</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-400 transition-colors">Launch →</span>
              </a>

              <a 
                href="http://localhost:15672" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-900/85 hover:border-amber-600/40 rounded-xl group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🐇</span>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">RabbitMQ Management</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-amber-500 transition-colors">Launch →</span>
              </a>
            </div>
          </div>

          {/* Quick Learning Card */}
          <div className="bg-gradient-to-br from-indigo-950/20 to-slate-950/80 border border-indigo-950/40 rounded-3xl p-6 shadow-xl">
            <h4 className="font-bold text-indigo-300 text-sm mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              How to demonstrate?
            </h4>
            <ol className="text-slate-400 text-xs space-y-2 list-decimal list-inside leading-relaxed">
              <li>Place a customer order or trigger failures above.</li>
              <li>Open <strong>Live Event Stream</strong> to watch real-time AMQP events.</li>
              <li>Inspect <strong>Jaeger Tracing</strong> to see the service-to-service spans.</li>
              <li>Observe performance metrics computed in the <strong>KPI Dashboard</strong>.</li>
            </ol>
            <div className="mt-4 pt-3 border-t border-indigo-950/60">
              <Link 
                href="/admin/architecture" 
                className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1"
              >
                Read Explanatory Docs →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

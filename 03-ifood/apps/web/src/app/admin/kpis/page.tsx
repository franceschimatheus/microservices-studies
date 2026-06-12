'use client';

import React from 'react';
import { useKPIs } from '@/features/analytics/hooks/useKPIs';
import Link from 'next/link';

export default function AdminKPIsPage() {
  const { kpis, loading: kpisLoading, error, refetch } = useKPIs();


  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        
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
                Platform Performance Analytics
              </h1>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live data feed active"></span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Real-time transactional metrics parsed directly from incoming RabbitMQ events and stored in the Data Lake.
            </p>
          </div>
          
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 bg-slate-900 border border-slate-900/60 hover:bg-slate-900 hover:border-slate-800 text-slate-200 font-bold py-2.5 px-5 rounded-xl transition-all shadow-md text-sm cursor-pointer whitespace-nowrap"
          >
            🔄 Refresh Metrics
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
            <div>
              <h4 className="font-bold text-sm">Ingestion Pipeline Warning</h4>
              <p className="text-xs text-rose-400/80 mt-0.5">{error}</p>
            </div>
            <button 
              onClick={() => refetch()} 
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold py-2 px-4 rounded-lg transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Dashboard Grid */}
        {kpisLoading && !kpis ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm">Retrieving database aggregations...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Total Orders Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-900/80 hover:border-indigo-950 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-xl group">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 py-1 px-3 rounded-full">
                    Volume
                  </span>
                  <span className="text-2xl group-hover:scale-110 transition-transform">📦</span>
                </div>
                <h3 className="text-slate-400 text-sm font-semibold mb-1">Total Orders Placed</h3>
                <p className="text-4xl font-extrabold tracking-tight text-white mb-2">
                  {kpis?.total_orders ?? 0}
                </p>
              </div>
              <div className="text-xs text-slate-500 border-t border-slate-900/60 pt-4 flex justify-between">
                <span>Refined from Bronze layer</span>
                <span className="text-emerald-400">Live feed active</span>
              </div>
            </div>

            {/* 2. Total Revenue Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-900/80 hover:border-emerald-950 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-xl group">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 py-1 px-3 rounded-full">
                    Finance
                  </span>
                  <span className="text-2xl group-hover:scale-110 transition-transform">💰</span>
                </div>
                <h3 className="text-slate-400 text-sm font-semibold mb-1">Total Revenue</h3>
                <p className="text-4xl font-extrabold tracking-tight text-emerald-400 mb-2">
                  ${(kpis?.total_revenue ?? 0.00).toFixed(2)}
                </p>
              </div>
              <div className="text-xs text-slate-500 border-t border-slate-900/60 pt-4 flex justify-between">
                <span>Excluding cancelled/pending</span>
                <span className="text-emerald-400">USD Standard</span>
              </div>
            </div>

            {/* 3. Payment Success Rate */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-900/80 hover:border-indigo-950 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-xl group">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 py-1 px-3 rounded-full">
                    Reliability
                  </span>
                  <span className="text-2xl group-hover:scale-110 transition-transform">🔒</span>
                </div>
                <h3 className="text-slate-400 text-sm font-semibold mb-1">Payment Success Rate</h3>
                <p className="text-4xl font-extrabold tracking-tight text-white mb-2">
                  {(kpis?.payment_success_rate ?? 0).toFixed(1)}%
                </p>
              </div>
              <div className="text-xs text-slate-500 border-t border-slate-900/60 pt-4 flex justify-between">
                <span>Successful vs Rejected txs</span>
                <span className="text-indigo-400">Audit-verified</span>
              </div>
            </div>

            {/* 4. Order Status Distribution Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-900/80 hover:border-indigo-950 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-xl lg:col-span-2 group">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 py-1 px-3 rounded-full">
                    Workflow
                  </span>
                  <span className="text-2xl group-hover:scale-110 transition-transform">📈</span>
                </div>
                <h3 className="text-slate-400 text-sm font-semibold mb-4">Order Fulfilment Ratio</h3>
                
                <div className="flex flex-col gap-4 mb-2">
                  {/* Delivered bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-semibold text-slate-300">
                      <span>Completed / Delivered</span>
                      <span>{kpis?.total_delivered_orders ?? 0} orders</span>
                    </div>
                    <div className="w-full h-3 bg-slate-850 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ 
                          width: `${kpis?.total_orders ? ((kpis.total_delivered_orders / kpis.total_orders) * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Cancelled bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-semibold text-slate-300">
                      <span>Cancelled</span>
                      <span>{kpis?.total_cancelled_orders ?? 0} orders</span>
                    </div>
                    <div className="w-full h-3 bg-slate-850 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{ 
                          width: `${kpis?.total_orders ? ((kpis.total_cancelled_orders / kpis.total_orders) * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500 border-t border-slate-900/60 pt-4 flex justify-between mt-4">
                <span>Calculated on refined order data</span>
                <span>Active ratios</span>
              </div>
            </div>

            {/* 5. Delivery Latency Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-900/80 hover:border-indigo-950 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-xl group">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 py-1 px-3 rounded-full">
                    Latency
                  </span>
                  <span className="text-2xl group-hover:scale-110 transition-transform">⚡</span>
                </div>
                <h3 className="text-slate-400 text-sm font-semibold mb-1">Avg Delivery Speed</h3>
                <p className="text-4xl font-extrabold tracking-tight text-white mb-2">
                  {(kpis?.avg_delivery_seconds ?? 0).toFixed(1)}s
                </p>
              </div>
              <div className="text-xs text-slate-500 border-t border-slate-900/60 pt-4 flex justify-between">
                <span>Assigned to Completed time</span>
                <span className="text-indigo-400">Simulation speed</span>
              </div>
            </div>

          </div>
        )}
    </div>
  );
}

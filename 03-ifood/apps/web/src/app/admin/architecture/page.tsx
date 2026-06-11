'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type TabType = 'topology' | 'messaging' | 'reliability' | 'datalake' | 'observability';

export default function AdminArchitecturePage() {
  const [activeTab, setActiveTab] = useState<TabType>('topology');

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'topology', label: 'Services Topology', icon: '🕸️' },
    { id: 'messaging', label: 'Event Choreography', icon: '🐇' },
    { id: 'reliability', label: 'Reliability Patterns', icon: '🛡️' },
    { id: 'datalake', label: 'Data Lake (ELT)', icon: '💾' },
    { id: 'observability', label: 'Observability Stack', icon: '📊' },
  ];

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
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
              Platform System Explanation
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Deep dive into the distributed microservices architecture, asynchronous flows, database design, and reliability engines.
            </p>
          </div>
        </div>

        {/* Custom Premium Tabs Navigation */}
        <div className="flex flex-wrap gap-2.5 border-b border-slate-900 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-950/40 border border-indigo-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-900/60 hover:border-slate-850'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950/80 border border-slate-900 rounded-3xl p-8 shadow-xl min-h-[500px]">
          
          {/* TAB 1: Services Topology */}
          {activeTab === 'topology' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <h2 className="text-2xl font-extrabold text-indigo-300 flex items-center gap-2">
                🕸️ Microservices Topology & Clean Architecture
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                The platform is constructed as a distributed monorepo of Go microservices. Every service strictly isolates its data store and communicates via gRPC (synchronous) or RabbitMQ (asynchronous).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
                <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🛡️</span>
                    <h4 className="font-bold text-slate-100">Auth Service</h4>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Manages credentials, JWT session validation, and permissions. Written in Go using Clean Architecture structure. Keeps users table separated.
                  </p>
                </div>
                
                <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🍔</span>
                    <h4 className="font-bold text-slate-100">Restaurant Service</h4>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Controls restaurants, menu listings, categories, and item structures. Generates outbox records to sync search projections.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🛒</span>
                    <h4 className="font-bold text-slate-100">Cart Service</h4>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Coordinates active user items in-memory. Powered by Redis key-value cache store with automatic cart TTL expiration.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">📦</span>
                    <h4 className="font-bold text-slate-100">Order Service</h4>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Hosts order placement, totals calculation, lifecycle states, and triggers payment workflows via outbox event streams.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">💳</span>
                    <h4 className="font-bold text-slate-100">Payment Service</h4>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Asynchronously handles payment processing, executes idempotency checks on orders, and reports completes/failures.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">⚡</span>
                    <h4 className="font-bold text-slate-100">Delivery Service</h4>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Coordinates order distribution, assigns available couriers, and publishes status updates.
                  </p>
                </div>
              </div>

              <div className="bg-indigo-950/15 border border-indigo-950 p-6 rounded-3xl mt-4">
                <h4 className="font-bold text-indigo-400 text-sm mb-2">Clean Architecture Code Pattern</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Every service folder follows a strict boundary separation:
                </p>
                <ul className="list-disc list-inside text-slate-400 text-xs mt-2 space-y-1">
                  <li><strong className="text-slate-200">domain/</strong>: Holds types, payloads, and interfaces (no external frameworks allowed here).</li>
                  <li><strong className="text-slate-200">repository/</strong>: Connects to Postgres (via pgx pool) or Redis.</li>
                  <li><strong className="text-slate-200">service/</strong>: Encapsulates pure business logic.</li>
                  <li><strong className="text-slate-200">handler/</strong>: Maps HTTP controllers or gRPC endpoints.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: Event Choreography */}
          {activeTab === 'messaging' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <h2 className="text-2xl font-extrabold text-indigo-300 flex items-center gap-2">
                🐇 Asynchronous Event Choreography (RabbitMQ)
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Rather than using orchestration (central orchestrator driving endpoints), services follow an event-driven choreography. They emit events upon completing state changes, and interested services consume them to run subsequent tasks.
              </p>

              <div className="overflow-x-auto mt-4 border border-slate-900 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-900">
                      <th className="p-4 font-bold">Exchange</th>
                      <th className="p-4 font-bold">Routing Key</th>
                      <th className="p-4 font-bold">Publishing Service</th>
                      <th className="p-4 font-bold">Subscribing Services / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    <tr>
                      <td className="p-4 font-mono text-indigo-400">orders.exchange</td>
                      <td className="p-4 font-mono">order.created</td>
                      <td className="p-4 text-emerald-400">order-service</td>
                      <td className="p-4">
                        <strong>payment-service</strong> (trigger charge) <br/>
                        <strong>notification-service</strong> (alert customer)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-mono text-indigo-400">payments.exchange</td>
                      <td className="p-4 font-mono">payment.completed</td>
                      <td className="p-4 text-emerald-400">payment-service</td>
                      <td className="p-4">
                        <strong>delivery-service</strong> (assign courier) <br/>
                        <strong>order-service</strong> (mark order PAID) <br/>
                        <strong>notification-service</strong> (receipt alert)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-mono text-indigo-400">delivery.exchange</td>
                      <td className="p-4 font-mono">delivery.completed</td>
                      <td className="p-4 text-emerald-400">delivery-service</td>
                      <td className="p-4">
                        <strong>order-service</strong> (mark order DELIVERED) <br/>
                        <strong>notification-service</strong> (inform arrival)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-mono text-indigo-400">restaurants.exchange</td>
                      <td className="p-4 font-mono">menu.updated</td>
                      <td className="p-4 text-emerald-400">restaurant-service</td>
                      <td className="p-4">
                        <strong>search-service</strong> (sync OpenSearch projections)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Reliability Patterns */}
          {activeTab === 'reliability' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <h2 className="text-2xl font-extrabold text-indigo-300 flex items-center gap-2">
                🛡️ Reliability & Distributed Systems Patterns
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Distributed architectures are prone to partial failures, network splits, and broker outages. The platform implements three critical patterns to guarantee consistency.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl flex flex-col gap-3">
                  <div className="text-2xl">📥</div>
                  <h4 className="font-bold text-slate-100">Transactional Outbox</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Prevents inconsistency (e.g., saving an order but failing to publish to RabbitMQ). 
                    Instead, events are written to a database `outbox` table within the same ACID transaction as the order. A background publisher worker polls the table and publishes messages to the broker.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl flex flex-col gap-3">
                  <div className="text-2xl">🔁</div>
                  <h4 className="font-bold text-slate-100">Idempotency Checks</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Guarantees safety during at-least-once deliveries. If RabbitMQ redelivers an order or payment event, the receiver detects the unique transaction ID in its database, avoiding double charges or duplicated courier assignments.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl flex flex-col gap-3">
                  <div className="text-2xl">⚠️</div>
                  <h4 className="font-bold text-slate-100">Retries & DLQs</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Transient broker/DB failures trigger message retries with backoff. If errors persist (e.g., invalid data format), RabbitMQ redirects the packet to a Dead Letter Queue (DLQ) for operator debugging without blocking the queues.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Data Lake (ELT) */}
          {activeTab === 'datalake' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <h2 className="text-2xl font-extrabold text-indigo-300 flex items-center gap-2">
                💾 Data Lake (Bronze $\rightarrow$ Silver $\rightarrow$ Gold)
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Rather than direct database querying which creates coupling and bottleneck, the analytics engine relies on an **ELT (Extract-Load-Transform)** data pipeline.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="bg-amber-950/10 border border-amber-950/60 p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">Raw</span>
                    <h4 className="font-bold text-slate-200">Bronze Layer</h4>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Consumers capture events directly from RabbitMQ and store the raw JSON payloads as-is into the `raw_events` table. No parsing or mapping occurs at this stage, preventing ingestion bottlenecks.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-900/60 p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold bg-slate-500/15 text-slate-300 px-2 py-0.5 rounded">Structured</span>
                    <h4 className="font-bold text-slate-200">Silver Layer</h4>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    A background service pipeline executes every 5 seconds, pulling unprocessed raw events, parsing the payload structure, and upserting the normalized records into structured tables: `orders_refined`, `payments_refined`, and `deliveries_refined`.
                  </p>
                </div>

                <div className="bg-emerald-950/10 border border-emerald-950/60 p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">KPIs</span>
                    <h4 className="font-bold text-slate-200">Gold Layer</h4>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Exposes aggregate views (`kpi_orders_summary`, `kpi_payment_success_rate`, `kpi_delivery_performance`) to compute financial and latency KPIs in real-time. Querying these views does not interfere with the active ordering database.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Observability Stack */}
          {activeTab === 'observability' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <h2 className="text-2xl font-extrabold text-indigo-300 flex items-center gap-2">
                📊 Observability Stack & Telemetry
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Observability is baked into the monorepo root through OpenTelemetry and the LGTM (Loki, Grafana, Tempo/Jaeger, Prometheus) stack.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl">
                  <h4 className="font-bold text-slate-100 mb-2">🕸️ Distributed Tracing (Jaeger)</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    The API Gateway intercepts client HTTP queries, initializes a trace context, and propagates it via metadata to down-stream gRPC microservices. This links the user actions to internal database queries in a single traceable visual span.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl">
                  <h4 className="font-bold text-slate-100 mb-2">🔥 Time-Series Metrics (Prometheus)</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Every Go service runs a dedicated `/metrics` server. Prometheus pulls connection pool statistics (active/idle connection count, wait timings) for Postgres and Redis, alongside standard HTTP and gRPC request counters.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

    </div>
  );
}

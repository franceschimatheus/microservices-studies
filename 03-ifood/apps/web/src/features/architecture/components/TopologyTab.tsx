import React from 'react';
import { useServiceStatusesQuery } from '../queries/useServiceStatusesQuery';
import { useToggleServiceMutation } from '../queries/useToggleServiceMutation';

export const TopologyTab = () => {
  const { data: statuses = {} } = useServiceStatusesQuery();
  const toggleMutation = useToggleServiceMutation();

  const handleToggle = (name: string) => {
    const isRunning = statuses[name] === 'running';
    toggleMutation.mutate({ name, action: isRunning ? 'stop' : 'start' });
  };

  const renderHeader = (title: string, icon: string, svcName: string) => {
    const isRunning = statuses[svcName] === 'running';
    const isUnknown = !statuses[svcName];

    return (
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h4 className="font-bold text-slate-100">{title}</h4>
        </div>
        {!isUnknown && (
          <button
            onClick={() => handleToggle(svcName)}
            disabled={toggleMutation.isPending}
            className={`w-10 h-5 rounded-full relative transition-colors ${
              isRunning ? 'bg-emerald-500' : 'bg-red-500'
            } ${toggleMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={isRunning ? 'Click to simulate Drop' : 'Click to start service'}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                isRunning ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        )}
      </div>
    );
  };

  return (
      <div className="flex flex-col gap-6 animate-fadeIn">
    <h2 className="text-2xl font-extrabold text-indigo-300 flex items-center gap-2">
      🕸️ Microservices Topology & Clean Architecture
    </h2>
    <p className="text-slate-300 text-sm leading-relaxed">
      The platform is constructed as a distributed monorepo of Go microservices. Every service strictly isolates its data store and communicates via gRPC (synchronous) or RabbitMQ (asynchronous).
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-4">
      
      {/* Gateway & Core */}
      <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col justify-between">
        <div>
          {renderHeader('API Gateway', '🚪', 'gateway')}
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            The single entry point for all frontend client traffic. Routes REST requests, forwards gRPC calls to internal services, handles rate-limiting, and initiates Jaeger distributed tracing spans.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Go</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">REST & gRPC</span>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col justify-between">
        <div>
          {renderHeader('Auth Service', '🛡️', 'auth-service')}
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Manages credentials, JWT session validation, and Role-Based Access Control (RBAC). Keeps the users database fully isolated and signs secure tokens for the Gateway to verify.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Go</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">PostgreSQL</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">JWT</span>
        </div>
      </div>
      
      {/* Catalog & Search */}
      <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col justify-between">
        <div>
          {renderHeader('Restaurant Service', '🍔', 'restaurant-service')}
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            The source of truth for restaurant profiles, menus, and item availability. Emits 'menu.updated' events via the transactional outbox pattern to sync external projections.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Go</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">PostgreSQL</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">RabbitMQ</span>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col justify-between">
        <div>
          {renderHeader('Search Service', '🔍', 'search-service')}
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Consumes menu events from RabbitMQ and indexes them into OpenSearch. Provides blazing fast, typo-tolerant full-text search across all active restaurants and dishes.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Go</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">OpenSearch</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">RabbitMQ</span>
        </div>
      </div>

      {/* Purchasing Flow */}
      <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col justify-between">
        <div>
          {renderHeader('Cart Service', '🛒', 'cart-service')}
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Coordinates active shopping carts entirely in-memory using Redis. Highly performant key-value store with automatic TTL expiration to clean up abandoned sessions.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Go</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">Redis</span>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col justify-between">
        <div>
          {renderHeader('Order Service', '📦', 'order-service')}
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            The orchestrator of the checkout flow. Hosts order placement, state machines (PENDING → PAID → DELIVERED), and triggers async payment workflows via outbox event streams.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Go</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">PostgreSQL</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">RabbitMQ</span>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col justify-between">
        <div>
          {renderHeader('Payment Service', '💳', 'payment-service')}
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Asynchronously processes mock credit card charges. Executes strict idempotency checks against transaction IDs to ensure users are never double-charged during broker retries.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Go</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">PostgreSQL</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">RabbitMQ</span>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col justify-between">
        <div>
          {renderHeader('Delivery Service', '⚡', 'delivery-service')}
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Reacts to successful payments to coordinate dispatch. Simulates courier assignment and transit latency, eventually publishing completion events back to the Order Service.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Go</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">PostgreSQL</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">RabbitMQ</span>
        </div>
      </div>

      {/* Operations */}
      <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col justify-between">
        <div>
          {renderHeader('Analytics Service', '📈', 'analytics-service')}
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Acts as the Data Lake sink. Silently intercepts all platform events from RabbitMQ, stores them as raw JSON (Bronze), and refines them (Silver) for KPI calculation without impacting live traffic.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Go</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">PostgreSQL</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">RabbitMQ</span>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col justify-between">
        <div>
          {renderHeader('Notification Service', '🔔', 'notification-service')}
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Listens to critical state changes across the cluster (e.g., payment failures, delivery completions) and acts as the central hub for dispatching WebSocket alerts or emails to users.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Go</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">WebSockets</span>
          <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">RabbitMQ</span>
        </div>
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
  );
};

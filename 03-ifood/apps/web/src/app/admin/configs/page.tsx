'use client';

import React, { useState } from 'react';
import { useServiceStatusesQuery } from '@/features/architecture/queries/useServiceStatusesQuery';
import { useToggleServiceMutation } from '@/features/architecture/queries/useToggleServiceMutation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

const SERVICES = [
  // Application Services
  { name: 'gateway', label: 'API Gateway', icon: '🚪' },
  { name: 'auth-service', label: 'Auth Service', icon: '🛡️' },
  { name: 'web', label: 'Web Frontend', icon: '🌐' },
  { name: 'restaurant-service', label: 'Restaurant Service', icon: '🍔' },
  { name: 'search-service', label: 'Search Service', icon: '🔍' },
  { name: 'cart-service', label: 'Cart Service', icon: '🛒' },
  { name: 'order-service', label: 'Order Service', icon: '📦' },
  { name: 'payment-service', label: 'Payment Service', icon: '💳' },
  { name: 'delivery-service', label: 'Delivery Service', icon: '⚡' },
  { name: 'analytics-service', label: 'Analytics Service', icon: '📈' },
  { name: 'notification-service', label: 'Notification Service', icon: '🔔' },
  { name: 'simulator', label: 'Simulator', icon: '🤖' },
  { name: 'bootstrap-service', label: 'Bootstrap Service', icon: '🏗️' },

  // Databases & Brokers
  { name: 'postgres-auth', label: 'Postgres (Auth)', icon: '🐘' },
  { name: 'postgres-restaurant', label: 'Postgres (Restaurant)', icon: '🐘' },
  { name: 'postgres-order', label: 'Postgres (Order)', icon: '🐘' },
  { name: 'postgres-payment', label: 'Postgres (Payment)', icon: '🐘' },
  { name: 'postgres-analytics', label: 'Postgres (Analytics)', icon: '🐘' },
  { name: 'redis', label: 'Redis', icon: '🔴' },
  { name: 'rabbitmq', label: 'RabbitMQ', icon: '🐇' },
  { name: 'opensearch', label: 'OpenSearch', icon: '🔎' },

  // Observability & Dashboards
  { name: 'otel-collector', label: 'OTel Collector', icon: '📡' },
  { name: 'jaeger', label: 'Jaeger', icon: '🔭' },
  { name: 'prometheus', label: 'Prometheus', icon: '🔥' },
  { name: 'grafana', label: 'Grafana', icon: '📊' },
  { name: 'promtail', label: 'Promtail', icon: '📝' },
  { name: 'loki', label: 'Loki', icon: '🪵' },
  { name: 'opensearch-dashboards', label: 'OpenSearch Dashboards', icon: '📈' },
  { name: 'redis-insight', label: 'Redis Insight', icon: '🛠️' },
  
  // Setup Jobs
  { name: 'grafana-setup', label: 'Grafana Setup', icon: '⚙️' },
  { name: 'opensearch-setup', label: 'OpenSearch Setup', icon: '⚙️' },
];

const IRREVERSIBLE_SERVICES = ['gateway', 'auth-service', 'web'];

export default function ConfigsPage() {
  const { data: statuses = {} } = useServiceStatusesQuery();
  const toggleMutation = useToggleServiceMutation();
  const { toast } = useToast();

  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleToggle = (name: string) => {
    const isRunning = statuses[name] === 'running';
    toggleMutation.mutate({ name, action: isRunning ? 'stop' : 'start' });
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
    <div className="flex flex-col gap-8 animate-fadeIn">
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-3 mb-2">
          System Configs ⚙️
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
          Manage system state, container availability, and hard reset capabilities.
        </p>
      </div>

      <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-red-400 mb-1">Danger Zone</h3>
          <p className="text-slate-500 text-sm">Hard reset the entire database cluster and seed initial data.</p>
        </div>
        <button 
          onClick={() => setShowResetConfirm(true)}
          disabled={isResetting}
          className="shrink-0 bg-slate-950/50 border border-red-900/60 hover:bg-red-500/10 text-red-400 disabled:opacity-50 text-sm font-bold py-3 px-6 rounded-2xl transition-all cursor-pointer shadow-lg w-full sm:w-auto text-center"
        >
          {isResetting ? 'Resetting System... 🔄' : 'Reset System & Seed ⚠️'}
        </button>
      </div>

      <div className="bg-slate-950/60 border border-slate-900/60 p-6 rounded-2xl">
        <h3 className="text-xl font-bold text-slate-200 mb-6">Container State Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((svc) => {
            const isRunning = statuses[svc.name] === 'running';
            const isUnknown = !statuses[svc.name];
            const isIrreversible = IRREVERSIBLE_SERVICES.includes(svc.name);

            return (
              <div key={svc.name} className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{svc.icon}</span>
                    <h4 className="font-bold text-slate-200">{svc.label}</h4>
                  </div>
                  {!isUnknown && (
                    <button
                      onClick={() => handleToggle(svc.name)}
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
                {isIrreversible && (
                  <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                    <span className="text-red-500 text-sm">🛑</span>
                    <p className="text-xs text-red-400 font-medium leading-relaxed">
                      <strong>Danger:</strong> Disabling this service from the UI is irreversible. The control panel relies on it to function.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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

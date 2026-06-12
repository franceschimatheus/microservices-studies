import React from 'react';

export const ReliabilityTab = () => {
  return (
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
  );
};

import React from 'react';

export const MessagingTab = () => {
  return (
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
            <td className="p-4 font-mono text-indigo-400 align-top">orders.exchange</td>
            <td className="p-4 font-mono align-top text-[11px] space-y-1">
              <div className="bg-slate-900/50 inline-block px-1.5 py-0.5 rounded">order.created</div><br/>
              <div className="bg-slate-900/50 inline-block px-1.5 py-0.5 rounded">order.updated</div>
            </td>
            <td className="p-4 text-emerald-400 align-top">order-service</td>
            <td className="p-4 text-xs leading-relaxed align-top space-y-1">
              <div><strong>payment-service</strong> (trigger charge)</div>
              <div><strong>notification-service</strong> (alert customer via WS)</div>
              <div><strong>analytics-service</strong> (data lake sink)</div>
            </td>
          </tr>
          <tr>
            <td className="p-4 font-mono text-indigo-400 align-top">payments.exchange</td>
            <td className="p-4 font-mono align-top text-[11px] space-y-1">
              <div className="bg-slate-900/50 inline-block px-1.5 py-0.5 rounded">payment.completed</div><br/>
              <div className="bg-slate-900/50 inline-block px-1.5 py-0.5 rounded">payment.failed</div>
            </td>
            <td className="p-4 text-emerald-400 align-top">payment-service</td>
            <td className="p-4 text-xs leading-relaxed align-top space-y-1">
              <div><strong>delivery-service</strong> (assign courier)</div>
              <div><strong>order-service</strong> (mark order PAID / FAILED)</div>
              <div><strong>notification-service</strong> (receipt / failure alert)</div>
              <div><strong>analytics-service</strong> (data lake sink)</div>
            </td>
          </tr>
          <tr>
            <td className="p-4 font-mono text-indigo-400 align-top">delivery.exchange</td>
            <td className="p-4 font-mono align-top text-[11px] space-y-1">
              <div className="bg-slate-900/50 inline-block px-1.5 py-0.5 rounded">delivery.assigned</div><br/>
              <div className="bg-slate-900/50 inline-block px-1.5 py-0.5 rounded">delivery.updated</div><br/>
              <div className="bg-slate-900/50 inline-block px-1.5 py-0.5 rounded">delivery.completed</div>
            </td>
            <td className="p-4 text-emerald-400 align-top">delivery-service</td>
            <td className="p-4 text-xs leading-relaxed align-top space-y-1">
              <div><strong>order-service</strong> (update order status / DELIVERED)</div>
              <div><strong>notification-service</strong> (inform arrival)</div>
              <div><strong>analytics-service</strong> (data lake sink)</div>
            </td>
          </tr>
          <tr>
            <td className="p-4 font-mono text-indigo-400 align-top">restaurants.exchange</td>
            <td className="p-4 font-mono align-top text-[11px] space-y-1">
              <div className="bg-slate-900/50 inline-block px-1.5 py-0.5 rounded">restaurant.created</div><br/>
              <div className="bg-slate-900/50 inline-block px-1.5 py-0.5 rounded">restaurant.updated</div><br/>
              <div className="bg-slate-900/50 inline-block px-1.5 py-0.5 rounded">restaurant.deleted</div><br/>
              <div className="bg-slate-900/50 inline-block px-1.5 py-0.5 rounded">menu.updated</div>
            </td>
            <td className="p-4 text-emerald-400 align-top">restaurant-service</td>
            <td className="p-4 text-xs leading-relaxed align-top">
              <div><strong>search-service</strong> (sync OpenSearch projections)</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  );
};

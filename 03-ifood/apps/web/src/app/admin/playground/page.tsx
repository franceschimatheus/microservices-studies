'use client';

import React, { useState } from 'react';
import { Zap, AlertTriangle, Clock, ServerCrash, XOctagon, TerminalSquare } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

import { _get, _post } from '@/services/api';

const SIMULATION_ENDPOINTS = {
  sim500: { url: '/debug/500', method: 'GET' },
  sim400: { url: '/debug/400', method: 'GET' },
  simLatency: { url: '/debug/latency', method: 'GET' },
  simDLQ: { url: '/debug/dlq', method: 'POST' },
};

export default function PlaygroundPage() {
  const [lastResult, setLastResult] = useState<{ id: string; status: number; text: string; time: string } | null>(null);

  const simulateMutation = useMutation({
    mutationFn: async (id: keyof typeof SIMULATION_ENDPOINTS) => {
      const endpoint = SIMULATION_ENDPOINTS[id];
      const start = Date.now();
      try {
        const response = endpoint.method === 'POST' ? await _post(endpoint.url) : await _get(endpoint.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        const time = `${Date.now() - start}ms`;
        return { id, status: response.status, text: JSON.stringify(data, null, 2), time };
      } catch (error) {
        const time = `${Date.now() - start}ms`;
        const message = error instanceof Error ? error.message : 'Unknown error';
        const status = error instanceof Error && 'status' in error ? Number((error as { status: number }).status) : 500;
        return { id, status, text: message, time };
      }
    },
    onSuccess: (data) => {
      setLastResult(data);
    },
    onError: (error, id) => {
      setLastResult({ id, status: 500, text: String(error), time: 'Unknown' });
    }
  });

  const handleSimulate = (id: keyof typeof SIMULATION_ENDPOINTS) => {
    simulateMutation.mutate(id);
  };

  const cards = [
    {
      id: 'sim500' as const,
      title: 'HTTP 500 Error',
      description: 'Trigger a deliberate 500 Internal Server Error in the Gateway to verify 5xx monitoring.',
      icon: ServerCrash,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      hover: 'hover:bg-rose-500/20 hover:border-rose-500/50',
    },
    {
      id: 'sim400' as const,
      title: 'HTTP 400 Error',
      description: 'Trigger a deliberate 400 Bad Request to verify 4xx monitoring panels.',
      icon: XOctagon,
      color: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      hover: 'hover:bg-orange-500/20 hover:border-orange-500/50',
    },
    {
      id: 'simLatency' as const,
      title: 'High Latency (5s)',
      description: 'Simulate a request that takes 5 seconds to resolve to test P95 latency metrics.',
      icon: Clock,
      color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      hover: 'hover:bg-yellow-500/20 hover:border-yellow-500/50',
    },
    {
      id: 'simDLQ' as const,
      title: 'RabbitMQ DLQ Event',
      description: 'Publish a "poison pill" message that the Notification Service will reject, sending it to the DLQ.',
      icon: AlertTriangle,
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      hover: 'hover:bg-indigo-500/20 hover:border-indigo-500/50',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <Zap className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Playground</h1>
          <p className="text-slate-400 text-sm mt-1">
            Simulate failures to test the observability stack and alert rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const isPending = simulateMutation.isPending && simulateMutation.variables === card.id;
          const Icon = card.icon;

          return (
            <div key={card.id} className={`p-6 rounded-2xl border bg-slate-900/50 backdrop-blur-xl transition-all ${card.hover} ${card.color.split(' ')[2]}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl border ${card.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200">{card.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => handleSimulate(card.id)}
                  disabled={simulateMutation.isPending}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    isPending
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : `bg-slate-800 text-slate-300 hover:text-white ${card.color.split(' ')[1].replace('text-', 'hover:bg-').replace('-400', '-500')}/20 border border-slate-700 hover:border-current`
                  }`}
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Trigger
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {lastResult && (
        <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-2xl animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-300 flex items-center gap-2">
              <TerminalSquare className="w-4 h-4 text-slate-500" />
              Execution Result
            </h3>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className={`px-2 py-1 rounded-md ${lastResult.status >= 400 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                HTTP {lastResult.status}
              </span>
              <span className="text-slate-500">{lastResult.time}</span>
            </div>
          </div>
          <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-slate-400 overflow-x-auto border border-slate-900">
            {lastResult.text}
          </pre>
        </div>
      )}
    </div>
  );
}

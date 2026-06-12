'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface LogEvent {
  id: string;
  type: string;
  timestamp: string;
  payload: any;
}

export default function AdminLiveLogsPage() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;

    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8085';
    const eventSource = new EventSource(`${gatewayUrl}/admin/logs/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newLog: LogEvent = {
          id: Math.random().toString(36).substring(7),
          type: data.type,
          timestamp: data.timestamp,
          payload: data.payload,
        };

        setLogs((prevLogs) => {
          const updatedLogs = [...prevLogs, newLog];
          // Keep only the last 100 logs to prevent memory issues
          return updatedLogs.slice(-100);
        });
      } catch (error) {
        console.error("Failed to parse log event:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [isPaused]);

  useEffect(() => {
    if (!isPaused && endOfLogsRef.current) {
      endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  const clearLogs = () => {
    setLogs([]);
  };

  const getEventColor = (type: string) => {
    if (type.includes('created') || type.includes('completed')) return 'text-green-400';
    if (type.includes('failed') || type.includes('cancelled')) return 'text-red-400';
    if (type.includes('updated') || type.includes('assigned')) return 'text-blue-400';
    return 'text-indigo-400';
  };

  return (
    <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto w-full">
      
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6 shrink-0">
        <div>
          <Link 
            href="/admin"
            className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-1.5 cursor-pointer mb-2 transition-all"
          >
            ← Back to Main Console
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
              Platform Live Logs
            </h1>
            <span className={`flex h-2.5 w-2.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}`} title={isPaused ? "Paused" : "Live"}></span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time event stream intercepted from the message broker choreography.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isPaused 
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30' 
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            {isPaused ? '▶ Resume Stream' : '⏸ Pause Stream'}
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-slate-900 text-slate-300 hover:bg-red-950 hover:text-red-400 border border-slate-700 hover:border-red-900 rounded-xl text-xs font-bold transition-all"
          >
            Clear Console
          </button>
        </div>
      </div>

      {/* Terminal Window */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-6 overflow-hidden flex flex-col shadow-2xl relative font-mono text-sm">
        
        {/* Fake Window Controls */}
        <div className="absolute top-0 left-0 w-full h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2 z-10 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span className="text-slate-500 text-xs ml-2 font-sans font-semibold">analytics-service-logger</span>
        </div>

        {/* Logs Container */}
        <div className="flex-1 overflow-y-auto mt-6 custom-scrollbar pr-2 space-y-2 pb-4">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 font-sans italic opacity-70">
              <span className="text-2xl mb-2">🐇</span>
              <p>Waiting for events from RabbitMQ...</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border-b border-slate-900/50 pb-2 mb-2 break-all group">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-slate-500 text-xs">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`font-bold ${getEventColor(log.type)}`}>[ {log.type.toUpperCase()} ]</span>
                </div>
                <div className="pl-4 border-l border-slate-800 ml-1 text-slate-300 group-hover:text-white transition-colors text-xs whitespace-pre-wrap">
                  {JSON.stringify(log.payload, null, 2)}
                </div>
              </div>
            ))
          )}
          <div ref={endOfLogsRef} />
        </div>
      </div>

    </div>
  );
}

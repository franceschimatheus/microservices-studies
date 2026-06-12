import React from 'react';

export const ObservabilityTab = () => {
  return (
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
  );
};

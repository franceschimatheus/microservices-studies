import React from 'react';

export const DataLakeTab = () => {
  return (
      <div className="flex flex-col gap-6 animate-fadeIn">
    <h2 className="text-2xl font-extrabold text-indigo-300 flex items-center gap-2">
      💾 Data Lake (Bronze → Silver → Gold)
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
  );
};

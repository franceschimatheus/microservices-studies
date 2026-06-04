import { Metrics } from "@/lib/types";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  accent?: string;
}

function StatCard({ label, value, accent = "text-indigo-400" }: StatCardProps) {
  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex justify-between items-center">
      <span className="text-sm font-medium text-zinc-400">{label}</span>
      <span className={`text-2xl font-bold font-mono ${accent}`}>{value}</span>
    </div>
  );
}

interface MetricsDashboardProps {
  metrics: Metrics;
}

export default function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  const healthPct = ((metrics.system_health ?? 0) * 100).toFixed(1);
  const healthColor =
    metrics.system_health >= 0.9
      ? "text-emerald-400"
      : metrics.system_health >= 0.7
      ? "text-amber-400"
      : "text-rose-400";

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold tracking-tight text-white mb-4">System Metrics</h2>

      <div className="space-y-3">
        <StatCard label="Orders Placed" value={metrics.total_orders ?? 0} />
        <StatCard
          label="Payments Processed"
          value={metrics.total_payments_processed ?? 0}
          accent="text-purple-400"
        />

        <div className="border-t border-zinc-800 pt-3 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block mb-2">
            Payment Outcomes
          </span>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Successful</span>
            <span className="font-mono font-semibold text-emerald-400">
              {metrics.total_payments_success ?? 0}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Failed</span>
            <span className="font-mono font-semibold text-rose-400">
              {metrics.total_payments_failed ?? 0}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Notifications Sent</span>
            <span className="font-mono font-semibold text-sky-400">
              {metrics.total_notifications_sent ?? 0}
            </span>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-zinc-400">System Health</span>
            <span className={`text-sm font-bold font-mono ${healthColor}`}>{healthPct}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                metrics.system_health >= 0.9
                  ? "bg-emerald-500"
                  : metrics.system_health >= 0.7
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(metrics.system_health * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

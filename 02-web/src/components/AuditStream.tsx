import { AuditEvent } from "@/lib/types";

function eventBadgeClass(eventType: string | undefined): string {
  const t = (eventType ?? "").toLowerCase();
  if (t.includes("failed") || t.includes("insufficient") || t.includes("released")) {
    return "bg-rose-500/10 text-rose-400 border-rose-500/25";
  }
  if (t.includes("completed") || t.includes("success") || t.includes("reserved") || t.includes("created")) {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
  }
  return "bg-sky-500/10 text-sky-400 border-sky-500/25";
}

/** Try to pretty-print the raw payload JSON string; fall back to raw text. */
function formatPayload(payload: string | undefined): string {
  if (!payload) return "No payload";
  try {
    return JSON.stringify(JSON.parse(payload), null, 0);
  } catch {
    return payload;
  }
}

interface EventRowProps {
  event: AuditEvent;
}

function EventRow({ event }: EventRowProps) {
  return (
    <div className="border-b border-zinc-900 pb-2.5 last:border-0 last:pb-0">
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${eventBadgeClass(
              event.type
            )}`}
          >
            {event.type ?? "unknown"}
          </span>
          {event.source && (
            <span className="text-[10px] text-zinc-600 truncate">{event.source}</span>
          )}
        </div>
        <span className="text-[10px] text-zinc-500 shrink-0">
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-zinc-400 break-words text-[11px] leading-relaxed font-mono">
        {formatPayload(event.payload)}
      </p>
    </div>
  );
}

interface AuditStreamProps {
  logs: AuditEvent[];
}

export default function AuditStream({ logs }: AuditStreamProps) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col h-[420px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight text-white">Audit Event Stream</h2>
        <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[10px] text-zinc-400 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
          LIVE
        </div>
      </div>

      <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs overflow-y-auto space-y-3.5">
        {logs.length > 0 ? (
          logs.map((event) => <EventRow key={event.id} event={event} />)
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500 italic text-center">
            Listening for telemetry on RabbitMQ…
          </div>
        )}
      </div>
    </section>
  );
}

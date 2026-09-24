"use client";

import type { TraceEvent } from "@/lib/types";

export function TracesPanel({ traces }: { traces: TraceEvent[] }) {
  const rows =
    traces.length > 0
      ? traces
      : [
          {
            id: "empty",
            timestamp: Date.now(),
            agent: "System",
            event: "No traces yet — build or chat to generate runs",
            status: "ok" as const,
          },
        ];

  return (
    <div className="flex h-full flex-col p-4">
      <div className="text-sm font-semibold text-paper">Observability</div>
      <p className="mt-1 text-xs text-muted">
        Live run log from builds, chat edits, and self-heal steps.
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-[72px_110px_1fr_64px] border-b border-line bg-ink-2 px-3 py-2 mono text-[10px] uppercase tracking-wider text-muted">
          <span>Time</span>
          <span>Agent</span>
          <span>Event</span>
          <span>Status</span>
        </div>
        {rows.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-[72px_110px_1fr_64px] border-b border-line/70 px-3 py-2 text-xs last:border-0"
          >
            <span className="mono text-muted">
              {new Date(r.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <span className="text-cyan">{r.agent}</span>
            <span className="text-paper">{r.event}</span>
            <span
              className={
                r.status === "ok"
                  ? "text-mint"
                  : r.status === "heal"
                    ? "text-amber"
                    : "text-rose"
              }
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

export function TracesPanel() {
  const rows = [
    { t: "12:04:01", agent: "Router", event: "classified intent → research", ok: true },
    { t: "12:04:02", agent: "Researcher", event: "rag hit 3 chunks · icp-guide.pdf", ok: true },
    { t: "12:04:03", agent: "Analyst", event: "risk score 0.42", ok: true },
    { t: "12:04:04", agent: "Presenter", event: "rendered brief card", ok: true },
    { t: "12:04:05", agent: "QA", event: "self-heal: missing import in page.tsx", ok: false },
  ];

  return (
    <div className="flex h-full flex-col p-4">
      <div className="text-sm font-semibold text-paper">Observability</div>
      <p className="mt-1 text-xs text-muted">
        Technical users need traces, simulations, and guardrail hits — not just a pretty preview.
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
            key={r.t + r.event}
            className="grid grid-cols-[72px_110px_1fr_64px] border-b border-line/70 px-3 py-2 text-xs last:border-0"
          >
            <span className="mono text-muted">{r.t}</span>
            <span className="text-cyan">{r.agent}</span>
            <span className="text-paper">{r.event}</span>
            <span className={r.ok ? "text-mint" : "text-amber"}>{r.ok ? "ok" : "heal"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

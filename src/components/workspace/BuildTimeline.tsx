"use client";

import { PHASES, phaseIndex } from "@/lib/utils";
import type { BuildPhase } from "@/lib/types";

export function BuildTimeline({
  phase,
  building,
}: {
  phase: BuildPhase;
  building?: boolean;
}) {
  const current = phaseIndex(phase);

  return (
    <div className="rounded-xl border border-line bg-ink-2 px-3 py-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Build map
        </span>
        {building && (
          <span className="building-pulse mono text-[10px] text-mint">building…</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {PHASES.map((step, i) => {
          const done = i <= current;
          const active = i === current;
          return (
            <div key={step.id} className="group relative flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition ${
                  done ? "bg-mint" : "bg-line"
                } ${active && building ? "building-pulse" : ""}`}
              />
              <span
                className={`mono text-[9px] ${
                  done ? "text-paper" : "text-muted"
                }`}
              >
                {step.label}
              </span>
              <div className="pointer-events-none absolute -bottom-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-panel px-2 py-1 text-[10px] text-muted group-hover:block">
                {step.tip}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

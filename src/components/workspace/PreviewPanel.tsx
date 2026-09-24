"use client";

import { MonitorSmartphone } from "lucide-react";

export function PreviewPanel({
  html,
  phase,
}: {
  html: string;
  phase: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="h-4 w-4 text-cyan" />
          <span className="text-sm font-semibold text-paper">Live app preview</span>
        </div>
        <span className="chip capitalize">{phase}</span>
      </div>
      <div className="relative min-h-0 flex-1 bg-[#05080f] p-3">
        <div className="h-full overflow-hidden rounded-xl border border-line bg-black">
          <iframe
            title="App preview"
            className="h-full w-full bg-black"
            sandbox="allow-scripts allow-forms allow-modals"
            srcDoc={html}
          />
        </div>
      </div>
    </div>
  );
}

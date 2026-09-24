"use client";

import { useState } from "react";
import type { CodeFile } from "@/lib/types";

export function FilesPanel({ files }: { files: CodeFile[] }) {
  const [active, setActive] = useState(files[0]?.path);

  const current = files.find((f) => f.path === active) || files[0];

  if (!files.length) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted">
        Source appears as the build progresses.
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[200px_1fr]">
      <div className="scrollbar-thin overflow-y-auto border-r border-line bg-ink-2">
        <div className="px-3 py-2 mono text-[10px] uppercase tracking-wider text-muted">
          Files
        </div>
        {files.map((f) => (
          <button
            key={f.path}
            onClick={() => setActive(f.path)}
            className={`block w-full truncate px-3 py-2 text-left text-xs ${
              active === f.path
                ? "bg-mint/10 text-mint"
                : "text-muted hover:bg-panel-2 hover:text-text"
            }`}
          >
            {f.path}
          </button>
        ))}
      </div>
      <div className="scrollbar-thin min-h-0 overflow-auto bg-[#0a101a] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="mono text-xs text-muted">{current?.path}</span>
          <span className="chip">{current?.language}</span>
        </div>
        <pre className="mono whitespace-pre-wrap text-[12px] leading-relaxed text-paper/90">
          {current?.content}
        </pre>
      </div>
    </div>
  );
}

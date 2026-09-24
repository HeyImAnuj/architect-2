"use client";

import { useEffect, useState } from "react";
import type { CodeFile } from "@/lib/types";

export function FilesPanel({
  files,
  onSave,
}: {
  files: CodeFile[];
  onSave: (path: string, content: string) => Promise<void> | void;
}) {
  const [active, setActive] = useState(files[0]?.path || "");
  const current = files.find((f) => f.path === active) || files[0];
  const [draft, setDraft] = useState(current?.content || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!files.find((f) => f.path === active) && files[0]) {
      setActive(files[0].path);
    }
  }, [files, active]);

  useEffect(() => {
    setDraft(current?.content || "");
  }, [current?.path, current?.content]);

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
      <div className="flex min-h-0 flex-col bg-[#0a101a]">
        <div className="flex items-center justify-between border-b border-line px-4 py-2">
          <span className="mono text-xs text-muted">{current?.path}</span>
          <div className="flex items-center gap-2">
            <span className="chip">{current?.language}</span>
            <button
              className="btn btn-primary px-3 py-1.5 text-xs"
              disabled={saving || draft === current?.content}
              onClick={async () => {
                if (!current) return;
                setSaving(true);
                try {
                  await onSave(current.path, draft);
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        <textarea
          className="scrollbar-thin mono min-h-0 flex-1 resize-none border-0 bg-transparent p-4 text-[12px] leading-relaxed text-paper/90 outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { FileText, Plus } from "lucide-react";
import type { KnowledgeFile } from "@/lib/types";

export function KnowledgePanel({
  files,
  onAdd,
}: {
  files: KnowledgeFile[];
  onAdd: (file: KnowledgeFile) => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    for (const file of Array.from(list)) {
      const content = await file.text();
      await onAdd({
        id: `know_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        content,
        type: file.type || "text",
        createdAt: Date.now(),
      });
    }
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-paper">Knowledge</div>
          <p className="text-xs text-muted">
            Upload real files. Their contents ground the preview workflow and chat context.
          </p>
        </div>
        <button className="btn btn-soft" onClick={() => inputRef.current?.click()}>
          <Plus className="h-4 w-4" /> Attach
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".txt,.md,.csv,.json,.pdf,.docx"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>
      <div className="mt-4 grid gap-2">
        {files.length === 0 && (
          <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            No knowledge yet. Attach files to give agents proprietary context.
          </div>
        )}
        {files.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-3 rounded-xl border border-line bg-ink-2 px-3 py-2"
          >
            <FileText className="h-4 w-4 text-cyan" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-paper">{f.name}</div>
              <div className="truncate text-[11px] text-muted">
                {f.content.slice(0, 80) || "Empty file"}
              </div>
            </div>
            <span className="chip">{Math.max(1, Math.round(f.content.length / 1024))}kb</span>
          </div>
        ))}
      </div>
    </div>
  );
}

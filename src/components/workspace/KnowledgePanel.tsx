"use client";

import { FileText, Plus } from "lucide-react";

export function KnowledgePanel({
  files,
  onAdd,
}: {
  files: string[];
  onAdd: () => void;
}) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-paper">Knowledge</div>
          <p className="text-xs text-muted">
            Ground agents with PDFs, CSVs, and notes — Soft attaches, Pro wires RAG.
          </p>
        </div>
        <button className="btn btn-soft" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Attach
        </button>
      </div>
      <div className="mt-4 grid gap-2">
        {files.length === 0 && (
          <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            No knowledge yet. Attach files to give agents proprietary context.
          </div>
        )}
        {files.map((f) => (
          <div
            key={f}
            className="flex items-center gap-3 rounded-xl border border-line bg-ink-2 px-3 py-2"
          >
            <FileText className="h-4 w-4 text-cyan" />
            <span className="text-sm text-paper">{f}</span>
            <span className="chip ml-auto">indexed</span>
          </div>
        ))}
      </div>
    </div>
  );
}

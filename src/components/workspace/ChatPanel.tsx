"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

export function ChatPanel({
  messages,
  onSend,
  mode,
}: {
  messages: ChatMessage[];
  onSend: (content: string) => void;
  mode: "soft" | "pro";
}) {
  const [value, setValue] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function submit() {
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line px-4 py-3">
        <div className="text-sm font-semibold text-paper">Architect chat</div>
        <div className="text-xs text-muted">
          {mode === "soft"
            ? "Describe outcomes — Architect reshapes agents + UI."
            : "Request diffs, refactors, and framework-level changes."}
        </div>
      </div>
      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-mint/15 text-paper"
                : m.role === "system"
                  ? "border border-amber/30 bg-amber/10 text-amber"
                  : "border border-line bg-ink-2 text-paper"
            }`}
          >
            {m.meta && (
              <div className="mono mb-1 text-[10px] uppercase tracking-wider text-muted">
                {m.meta}
              </div>
            )}
            {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="border-t border-line p-3">
        <div className="flex gap-2">
          <textarea
            className="textarea min-h-[72px] flex-1"
            placeholder={
              mode === "soft"
                ? "Make the triage card calmer and add a citations panel…"
                : "Add a LangGraph checkpoint and expose tool traces in the UI…"
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button className="btn btn-primary self-end" onClick={submit}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

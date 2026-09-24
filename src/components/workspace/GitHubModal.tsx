"use client";

import { useState } from "react";
import { X, GitBranch, Check } from "lucide-react";

export function GitHubModal({
  open,
  onClose,
  connected,
  repo,
  onConnect,
}: {
  open: boolean;
  onClose: () => void;
  connected: boolean;
  repo?: string;
  onConnect: (repo: string) => void;
}) {
  const [value, setValue] = useState(repo || "acme/my-agent-app");
  const [step, setStep] = useState<"auth" | "repo" | "done">(
    connected ? "done" : "auth",
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-lg p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-paper">GitHub</h2>
          </div>
          <button className="btn btn-ghost px-2 py-2" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          {["auth", "repo", "done"].map((s, i) => (
            <div
              key={s}
              className={`flex-1 rounded-full py-1 text-center mono text-[10px] uppercase tracking-wider ${
                step === s || (step === "done" && i < 3) || (step === "repo" && i === 0)
                  ? "bg-mint/15 text-mint"
                  : "bg-ink-2 text-muted"
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {step === "auth" && (
          <div className="mt-5">
            <p className="text-sm text-muted">
              Dummy OAuth: grant Architect access to create branches and open PRs from
              Soft or Pro changes.
            </p>
            <button
              className="btn btn-primary mt-4"
              onClick={() => setStep("repo")}
            >
              Authorize GitHub
            </button>
          </div>
        )}

        {step === "repo" && (
          <div className="mt-5 grid gap-3">
            <label className="text-sm text-muted">Repository</label>
            <input
              className="input mono"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                onConnect(value);
                setStep("done");
              }}
            >
              Connect repository
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="mt-5 rounded-xl border border-mint/30 bg-mint/10 p-4">
            <div className="flex items-center gap-2 text-mint">
              <Check className="h-4 w-4" />
              Connected to <span className="mono text-paper">{repo || value}</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              Soft changes open draft PRs. Pro users can push branches and review diffs.
            </p>
            <button className="btn btn-soft mt-4" onClick={onClose}>
              Back to atelier
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

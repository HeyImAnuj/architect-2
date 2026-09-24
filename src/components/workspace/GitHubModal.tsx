"use client";

import { useEffect, useState } from "react";
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
  onConnect: (repo: string) => Promise<string> | string;
}) {
  const [value, setValue] = useState(repo || "acme/my-agent-app");
  const [step, setStep] = useState<"auth" | "repo" | "done">(
    connected ? "done" : "auth",
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(connected ? "done" : "auth");
      setValue(repo || "acme/my-agent-app");
      setMessage("");
      setError(null);
    }
  }, [open, connected, repo]);

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

        {step === "auth" && (
          <div className="mt-5">
            <p className="text-sm text-muted">
              Connect a repository. With <span className="mono">GITHUB_TOKEN</span> set,
              Architect also publishes a public gist of your source.
            </p>
            <button className="btn btn-primary mt-4" onClick={() => setStep("repo")}>
              Continue
            </button>
          </div>
        )}

        {step === "repo" && (
          <div className="mt-5 grid gap-3">
            <label className="text-sm text-muted">Repository (org/repo)</label>
            <input
              className="input mono"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {error && <div className="text-sm text-rose">{error}</div>}
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  const msg = await onConnect(value);
                  setMessage(typeof msg === "string" ? msg : "Connected");
                  setStep("done");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Connecting…" : "Connect repository"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="mt-5 rounded-xl border border-mint/30 bg-mint/10 p-4">
            <div className="flex items-center gap-2 text-mint">
              <Check className="h-4 w-4" />
              Connected to <span className="mono text-paper">{repo || value}</span>
            </div>
            {message && <p className="mt-2 text-sm text-muted">{message}</p>}
            <button className="btn btn-soft mt-4" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

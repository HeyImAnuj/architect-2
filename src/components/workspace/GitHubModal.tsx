"use client";

import { useEffect, useState } from "react";
import { X, GitBranch, Check } from "lucide-react";

type Repo = { fullName: string; private: boolean };

export function GitHubModal({
  open,
  onClose,
  connected,
  repo,
  onConnect,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  connected: boolean;
  repo?: string;
  onConnect: (repo: string) => Promise<string> | string;
  onImport?: (repo: string) => Promise<void>;
}) {
  const [login, setLogin] = useState<string | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState("");

  async function load() {
    const res = await fetch("/api/github/status");
    const data = (await res.json()) as {
      connected?: boolean;
      configured?: boolean;
      login?: string | null;
      repos?: Repo[];
      error?: string;
    };
    if (!res.ok) throw new Error(data.error || "Could not check GitHub.");
    setConfigured(data.configured !== false);
    setGithubConnected(Boolean(data.connected));
    setLogin(data.login || null);
    setRepos(data.repos || []);
    setSelected(data.repos?.[0]?.fullName || "");
  }

  useEffect(() => {
    if (!open) return;
    setMessage("");
    setError(null);
    void load().catch(() => setError("Could not check the GitHub connection."));
  }, [open]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; ok?: boolean; message?: string };
      if (data?.type !== "architect-github") return;
      if (data.ok) void load();
      else setError(data.message || "GitHub sign-in failed.");
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

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

        {!githubConnected ? (
          <div className="mt-5">
            <p className="text-sm text-muted">
              {configured
                ? "Sign in with GitHub. Architect will create a repository in your account and push this project."
                : "GitHub sign-in needs GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env, from a GitHub OAuth app whose callback is http://localhost:3000/api/github/callback. Then restart the dev server."}
            </p>
            {error && <p className="mt-3 text-sm text-rose">{error}</p>}
            <button
              className="btn btn-primary mt-4"
              disabled={!configured}
              onClick={() =>
                window.open("/api/github/start", "architect-github", "width=640,height=760")
              }
            >
              Sign in with GitHub
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            <p className="text-sm text-muted">
              Signed in as <span className="font-semibold text-paper">{login}</span>.
            </p>
            {connected && repo && (
              <div className="flex items-center gap-2 text-sm text-mint">
                <Check className="h-4 w-4" />
                <a className="underline" href={`https://github.com/${repo}`} target="_blank" rel="noreferrer">
                  {repo}
                </a>
              </div>
            )}
            {error && <p className="text-sm text-rose">{error}</p>}
            {message && <p className="text-sm text-muted">{message}</p>}
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  const msg = await onConnect(repo || login || "architect-app");
                  setMessage(typeof msg === "string" ? msg : "Repository created.");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not create the repository.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Pushing…" : "Create repository and push"}
            </button>
            {repos.length > 0 && onImport && (
              <div className="grid gap-2">
                <label className="text-sm text-muted">Import one of your repositories into this project</label>
                <select className="input" value={selected} onChange={(event) => setSelected(event.target.value)}>
                  {repos.map((item) => (
                    <option key={item.fullName} value={item.fullName}>
                      {item.fullName}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-soft"
                  disabled={busy || !selected}
                  onClick={async () => {
                    setBusy(true);
                    setError(null);
                    try {
                      await onImport(selected);
                      setMessage(`Imported ${selected}.`);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Import failed.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Import repository
                </button>
              </div>
            )}
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

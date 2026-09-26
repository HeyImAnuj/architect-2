"use client";

import { useEffect, useState } from "react";
import { Rocket, X, ExternalLink, Check } from "lucide-react";

export function DeployModal({
  open,
  onClose,
  deployed,
  url,
  githubRepo,
  onDeploy,
}: {
  open: boolean;
  onClose: () => void;
  deployed: boolean;
  url?: string;
  githubRepo?: string;
  onDeploy: (meta: { env: string; region: string }) => Promise<string>;
}) {
  const [step, setStep] = useState<"env" | "region" | "ship" | "live">(
    deployed ? "live" : "env",
  );
  const [env, setEnv] = useState("preview");
  const [region, setRegion] = useState("us-east");
  const [liveUrl, setLiveUrl] = useState(url || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(deployed && url ? "live" : "env");
      setLiveUrl(url || "");
      setError(null);
    }
  }, [open, deployed, url]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-lg p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-amber" />
            <h2 className="text-lg font-semibold text-paper">Deploy</h2>
          </div>
          <button className="btn btn-ghost px-2 py-2" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "env" && (
          <div className="mt-5 grid gap-3">
            <p className="text-sm text-muted">
              Publish a real hosted preview at an Architect URL others can open.
            </p>
            <label className="text-sm text-muted">Environment</label>
            <select
              className="input"
              value={env}
              onChange={(e) => setEnv(e.target.value)}
            >
              <option value="preview">Preview</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
            <button className="btn btn-primary" onClick={() => setStep("region")}>
              Continue
            </button>
          </div>
        )}

        {step === "region" && (
          <div className="mt-5 grid gap-3">
            <label className="text-sm text-muted">Region</label>
            <div className="grid grid-cols-2 gap-2">
              {["us-east", "eu-west", "ap-south", "us-west"].map((r) => (
                <button
                  key={r}
                  className={`btn justify-start ${
                    region === r ? "btn-primary" : "btn-soft"
                  }`}
                  onClick={() => setRegion(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => setStep("ship")}>
              Continue
            </button>
          </div>
        )}

        {step === "ship" && (
          <div className="mt-5">
            <p className="text-sm text-muted">
              This publishes the working preview at a public Architect URL.
              {githubRepo ? " The GitHub repository is listed below." : ""}
            </p>
            {error && <p className="mt-2 text-sm text-rose">{error}</p>}
            <button
              className="btn btn-primary mt-4"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  const next = await onDeploy({ env, region });
                  setLiveUrl(next);
                  setStep("live");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Deploy failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Shipping…" : "Ship now"}
            </button>
          </div>
        )}

        {step === "live" && (
          <div className="mt-5 rounded-xl border border-mint/30 bg-mint/10 p-4">
            <div className="flex items-center gap-2 text-mint">
              <Check className="h-4 w-4" /> Live
            </div>
            <a
              href={liveUrl || url || "#"}
              className="mt-2 inline-flex items-center gap-2 text-sm text-paper underline"
              target="_blank"
              rel="noreferrer"
            >
              {liveUrl || url} <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {githubRepo && (
              <a
                href={`https://github.com/${githubRepo}`}
                className="mt-2 flex items-center gap-2 text-sm text-paper underline"
                target="_blank"
                rel="noreferrer"
              >
                github.com/{githubRepo} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button className="btn btn-soft mt-4" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Rocket, X, ExternalLink, Check } from "lucide-react";

export function DeployModal({
  open,
  onClose,
  deployed,
  url,
  onDeploy,
}: {
  open: boolean;
  onClose: () => void;
  deployed: boolean;
  url?: string;
  onDeploy: () => void;
}) {
  const [step, setStep] = useState<"env" | "region" | "ship" | "live">(
    deployed ? "live" : "env",
  );

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
              Soft users pick a preset. Pro users can set secrets, regions, and custom domains.
            </p>
            <label className="text-sm text-muted">Environment</label>
            <select className="input">
              <option>Preview</option>
              <option>Staging</option>
              <option>Production</option>
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
                <button key={r} className="btn btn-soft justify-start">
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
              Architect will promote the current preview, run smoke checks, and publish a URL.
            </p>
            <button
              className="btn btn-primary mt-4"
              onClick={() => {
                onDeploy();
                setStep("live");
              }}
            >
              Ship now
            </button>
          </div>
        )}

        {step === "live" && (
          <div className="mt-5 rounded-xl border border-mint/30 bg-mint/10 p-4">
            <div className="flex items-center gap-2 text-mint">
              <Check className="h-4 w-4" /> Live
            </div>
            <a
              href={url || "#"}
              className="mt-2 inline-flex items-center gap-2 text-sm text-paper underline"
              target="_blank"
              rel="noreferrer"
            >
              {url || "https://app.architect.new"} <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button className="btn btn-soft mt-4" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

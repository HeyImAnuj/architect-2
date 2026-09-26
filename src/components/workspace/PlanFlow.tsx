"use client";

import { useState } from "react";
import { PLAN_QUESTIONS } from "@/lib/plan";
import { clientApi } from "@/lib/client-api";
import { useAppStore } from "@/lib/store";

export function PlanFlow({
  projectId,
  prompt,
  onBuilt,
}: {
  projectId: string;
  prompt: string;
  onBuilt: () => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState(false);

  const question = PLAN_QUESTIONS[step];
  const selected = answers[question?.id || ""] ;

  function choose(optionId: string) {
    if (!question) return;
    if (question.type === "single") {
      setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
      return;
    }
    const current = Array.isArray(answers[question.id])
      ? (answers[question.id] as string[])
      : [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    setAnswers((prev) => ({ ...prev, [question.id]: next }));
  }

  function canContinue() {
    if (!question) return false;
    const value = answers[question.id];
    if (question.type === "multi") return Array.isArray(value) && value.length > 0;
    return typeof value === "string" && value.length > 0;
  }

  async function build() {
    setBuilding(true);
    setError(null);
    try {
      const { project } = await clientApi.build(projectId, answers);
      useAppStore.setState((s) => ({
        projects: s.projects.map((p) => (p.id === projectId ? project : p)),
      }));
      onBuilt();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build");
    } finally {
      setBuilding(false);
    }
  }

  if (review) {
    return (
      <div className="mx-auto flex h-full max-w-2xl flex-col justify-center px-6 py-10">
        <p className="text-sm font-semibold text-mint">Ready to build</p>
        <h2 className="display mt-2 text-3xl font-bold text-paper">
          We have enough to start
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Architect will turn “{prompt.slice(0, 140)}” into a plan, a first screen,
          and a working agent graph. You can change anything afterwards.
        </p>
        {error && <p className="mt-3 text-sm text-rose">{error}</p>}
        <div className="mt-6 flex gap-3">
          <button className="btn btn-ghost" onClick={() => setReview(false)} disabled={building}>
            Back
          </button>
          <button className="btn btn-primary" onClick={() => void build()} disabled={building}>
            {building ? "Building…" : "Start building"}
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col justify-center px-6 py-10">
      <p className="text-sm font-semibold text-mint">
        Question {step + 1} of {PLAN_QUESTIONS.length}
      </p>
      <h2 className="display mt-2 text-3xl font-bold text-paper">{question.title}</h2>
      <p className="mt-2 text-sm text-muted">{question.why}</p>
      <div className="mt-6 grid gap-3">
        {question.options.map((option) => {
          const active =
            question.type === "multi"
              ? Array.isArray(selected) && selected.includes(option.id)
              : selected === option.id;
          return (
            <button
              key={option.id}
              onClick={() => choose(option.id)}
              className={`rounded-2xl border px-4 py-3 text-left ${
                active ? "border-mint bg-mint/10" : "border-line bg-white hover:border-cyan/40"
              }`}
            >
              <div className="font-semibold text-paper">{option.title}</div>
              <div className="mt-1 text-sm text-muted">{option.detail}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex gap-3">
        <button
          className="btn btn-ghost"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={!canContinue()}
          onClick={() => {
            if (step === PLAN_QUESTIONS.length - 1) setReview(true);
            else setStep((s) => s + 1);
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { PLAN_QUESTIONS } from "@/lib/plan";

export function PlanFlow({
  prompt,
  onContinue,
}: {
  prompt: string;
  onContinue: (answers: Record<string, string | string[]>) => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const question = PLAN_QUESTIONS[step];
  const selected = answers[question?.id || ""];

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

  if (!question) return null;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col justify-center px-6 py-10">
      <p className="text-sm font-semibold text-mint">
        Question {step + 1} of {PLAN_QUESTIONS.length}
      </p>
      <p className="mt-2 line-clamp-2 text-sm text-muted">{prompt}</p>
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
            if (step === PLAN_QUESTIONS.length - 1) onContinue(answers);
            else setStep((s) => s + 1);
          }}
        >
          {step === PLAN_QUESTIONS.length - 1 ? "Open the flow" : "Continue"}
        </button>
      </div>
    </div>
  );
}

import { clsx, type ClassValue } from "clsx";
import type { BuildPhase, FrameworkId } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const FRAMEWORKS: {
  id: FrameworkId;
  label: string;
  blurb: string;
  audience: "both" | "pro";
}[] = [
  {
    id: "lyzr",
    label: "Lyzr Agents",
    blurb: "Best default for agentic apps with Studio + guardrails.",
    audience: "both",
  },
  {
    id: "langgraph",
    label: "LangGraph",
    blurb: "Stateful graphs with explicit control flow for engineers.",
    audience: "pro",
  },
  {
    id: "crewai",
    label: "CrewAI",
    blurb: "Role-based crews that collaborate on multi-step jobs.",
    audience: "both",
  },
  {
    id: "autogen",
    label: "AutoGen",
    blurb: "Multi-agent conversations with tool-calling loops.",
    audience: "pro",
  },
  {
    id: "openai-agents",
    label: "OpenAI Agents",
    blurb: "Lightweight agent runtime with handoffs.",
    audience: "pro",
  },
  {
    id: "custom",
    label: "Custom / BYO",
    blurb: "Bring your own orchestration layer and wire it in.",
    audience: "pro",
  },
];

export const PHASES: { id: BuildPhase; label: string; tip: string }[] = [
  { id: "intent", label: "Intent", tip: "What you asked for" },
  { id: "plan", label: "Plan", tip: "Decide what the app should do" },
  { id: "agents", label: "Agents", tip: "Who does the work" },
  { id: "ui", label: "App", tip: "The screen people will use" },
  { id: "qa", label: "Check", tip: "Catch and fix problems" },
  { id: "ready", label: "Ready", tip: "Use it, share it, ship it" },
];

export function phaseIndex(phase: BuildPhase) {
  return PHASES.findIndex((p) => p.id === phase);
}

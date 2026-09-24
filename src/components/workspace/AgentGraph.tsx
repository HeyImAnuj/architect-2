"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { AgentEdge, AgentNode } from "@/lib/types";
import { uid } from "@/lib/utils";

export function AgentGraph({
  agents,
  edges,
  building,
  onChange,
}: {
  agents: AgentNode[];
  edges: AgentEdge[];
  building?: boolean;
  onChange?: (agents: AgentNode[]) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = agents.find((a) => a.id === selected);

  if (agents.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div>
          <div className="display text-xl font-bold text-paper">Agent canvas</div>
          <p className="mt-2 max-w-sm text-sm text-muted">
            {building
              ? "Drafting the multi-agent graph…"
              : "No agents yet. Add one or generate from a prompt."}
          </p>
        </div>
        {onChange && (
          <button
            className="btn btn-primary"
            onClick={() =>
              onChange([
                {
                  id: uid("agent"),
                  name: "Router",
                  role: "Routes user intent",
                  model: "gpt-4.1",
                  tools: ["classify"],
                  status: "ready",
                  x: 40,
                  y: 40,
                },
              ])
            }
          >
            <Plus className="h-4 w-4" /> Add agent
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative grid h-full min-h-0 grid-rows-[1fr_auto]">
      <div className="relative min-h-[320px] overflow-hidden p-4">
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {edges.map((edge) => {
            const from = agents.find((a) => a.id === edge.from);
            const to = agents.find((a) => a.id === edge.to);
            if (!from || !to) return null;
            return (
              <line
                key={edge.id}
                x1={`${from.x}%`}
                y1={`${from.y}%`}
                x2={`${to.x}%`}
                y2={`${to.y}%`}
                stroke="#2dd4bf55"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            );
          })}
        </svg>
        {agents.map((agent, i) => (
          <motion.button
            key={agent.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelected(agent.id)}
            className={`absolute w-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-panel p-3 text-left shadow-lg ${
              selected === agent.id ? "border-mint" : "border-line hover:border-mint/50"
            }`}
            style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-paper">{agent.name}</span>
              <span className="chip chip-mint">{agent.status}</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-muted">{agent.role}</p>
            <div className="mono mt-2 text-[10px] text-cyan">{agent.model}</div>
          </motion.button>
        ))}
        {onChange && (
          <button
            className="btn btn-soft absolute bottom-4 right-4"
            onClick={() => {
              const agent: AgentNode = {
                id: uid("agent"),
                name: `Agent ${agents.length + 1}`,
                role: "Specialist worker",
                model: "gpt-4.1",
                tools: ["tools"],
                status: "ready",
                x: 20 + (agents.length % 4) * 18,
                y: 25 + (agents.length % 3) * 20,
              };
              onChange([...agents, agent]);
              setSelected(agent.id);
            }}
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        )}
      </div>

      {active && onChange && (
        <div className="border-t border-line bg-ink-2 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="input"
              value={active.name}
              onChange={(e) =>
                onChange(
                  agents.map((a) =>
                    a.id === active.id ? { ...a, name: e.target.value } : a,
                  ),
                )
              }
            />
            <input
              className="input"
              value={active.model}
              onChange={(e) =>
                onChange(
                  agents.map((a) =>
                    a.id === active.id ? { ...a, model: e.target.value } : a,
                  ),
                )
              }
            />
            <input
              className="input sm:col-span-2"
              value={active.role}
              onChange={(e) =>
                onChange(
                  agents.map((a) =>
                    a.id === active.id ? { ...a, role: e.target.value } : a,
                  ),
                )
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import type { AgentEdge, AgentNode } from "@/lib/types";

export function AgentGraph({
  agents,
  edges,
  building,
}: {
  agents: AgentNode[];
  edges: AgentEdge[];
  building?: boolean;
}) {
  if (agents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <div className="display text-xl font-bold text-paper">Agent canvas</div>
          <p className="mt-2 max-w-sm text-sm text-muted">
            {building
              ? "Drafting the multi-agent graph…"
              : "Agents appear here after planning. Soft users edit cards; Pro users edit graph code."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[320px] overflow-hidden p-4">
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {edges.map((edge) => {
          const from = agents.find((a) => a.id === edge.from);
          const to = agents.find((a) => a.id === edge.to);
          if (!from || !to) return null;
          const x1 = `${from.x}%`;
          const y1 = `${from.y}%`;
          const x2 = `${to.x}%`;
          const y2 = `${to.y}%`;
          return (
            <g key={edge.id}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#2dd4bf55"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </g>
          );
        })}
      </svg>
      {agents.map((agent, i) => (
        <motion.button
          key={agent.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
          className="absolute w-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-panel p-3 text-left shadow-lg hover:border-mint/50"
          style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-paper">{agent.name}</span>
            <span className="chip chip-mint">{agent.status}</span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-muted">{agent.role}</p>
          <div className="mono mt-2 text-[10px] text-cyan">{agent.model}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {agent.tools.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        </motion.button>
      ))}
    </div>
  );
}

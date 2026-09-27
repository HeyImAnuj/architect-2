"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { AgentEdge, AgentNode } from "@/lib/types";
import { uid } from "@/lib/utils";
import { CanvasBoard, NodeDialog, boardIconBtn } from "@/components/workspace/CanvasBoard";

function asPixels(nodes: AgentNode[]) {
  if (nodes.length === 0) return nodes;
  const percent = nodes.every((node) => node.x <= 100 && node.y <= 100);
  if (!percent) return nodes;
  return nodes.map((node) => ({
    ...node,
    x: 96 + (node.x / 100) * 1400,
    y: 96 + (node.y / 100) * 860,
  }));
}

const STATUSES: AgentNode["status"][] = ["idle", "running", "ready", "error"];

export function AgentGraph({
  agents,
  edges,
  building,
  onChange,
  onEdges,
}: {
  agents: AgentNode[];
  edges: AgentEdge[];
  building?: boolean;
  onChange?: (agents: AgentNode[]) => void;
  onEdges?: (edges: AgentEdge[]) => void;
}) {
  const [local, setLocal] = useState<AgentNode[]>(() => asPixels(agents));
  const localRef = useRef(local);
  const [selected, setSelected] = useState<string | null>(null);
  const active = local.find((agent) => agent.id === selected);
  const activeEdge = edges.find((edge) => edge.id === selected);

  useEffect(() => {
    const next = asPixels(agents);
    localRef.current = next;
    setLocal(next);
  }, [agents]);

  function commit(next: AgentNode[]) {
    localRef.current = next;
    setLocal(next);
    onChange?.(next);
  }

  function connect(from: string, to: string) {
    if (!onEdges || edges.some((edge) => edge.from === from && edge.to === to)) return;
    const edge: AgentEdge = { id: uid("edge"), from, to, label: "when this step is ready" };
    onEdges([...edges, edge]);
    setSelected(edge.id);
  }

  return (
    <div className="relative h-full min-h-0">
      <CanvasBoard
        width={1800}
        height={1200}
        points={local}
        edges={edges}
        selectedId={selected}
        onMove={(id, x, y) => {
          const next = localRef.current.map((agent) => (agent.id === id ? { ...agent, x, y } : agent));
          localRef.current = next;
          setLocal(next);
        }}
        onMoveCommit={() => onChange?.(localRef.current)}
        onConnect={connect}
        onNodeClick={setSelected}
        onEdgeClick={setSelected}
        actions={
          <button
            type="button"
            className={`${boardIconBtn} w-7`}
            aria-label="Add agent"
            disabled={!onChange}
            onClick={() => {
              const agent: AgentNode = {
                id: uid("agent"),
                name: `Agent ${local.length + 1}`,
                role: "Describe what this agent does",
                model: "gpt-4.1",
                tools: ["tools"],
                status: "ready",
                x: 140 + (local.length % 5) * 48,
                y: 140 + Math.floor(local.length / 5) * 40,
              };
              commit([...local, agent]);
              setSelected(agent.id);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
        renderCard={(id) => {
          const agent = local.find((item) => item.id === id);
          if (!agent) return null;
          return (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-paper">{agent.name}</span>
                <span className="chip chip-mint shrink-0">{agent.status}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">{agent.role}</p>
              <div className="mono mt-1 truncate text-[10px] text-cyan">{agent.model}</div>
            </>
          );
        }}
      />
      {local.length === 0 && (
        <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-muted">
          {building ? "Drafting the agent graph…" : "No agents yet. Use + to add one."}
        </p>
      )}
      {active && onChange && (
        <AgentDialog
          key={active.id}
          agent={active}
          onCancel={() => setSelected(null)}
          onSave={(next) => {
            commit(local.map((agent) => (agent.id === active.id ? { ...agent, ...next } : agent)));
            setSelected(null);
          }}
          onRemove={() => {
            commit(local.filter((agent) => agent.id !== active.id));
            onEdges?.(edges.filter((edge) => edge.from !== active.id && edge.to !== active.id));
            setSelected(null);
          }}
        />
      )}
      {activeEdge && onEdges && (
        <ConditionDialog
          key={activeEdge.id}
          label={activeEdge.label || ""}
          onCancel={() => setSelected(null)}
          onSave={(label) => {
            onEdges(edges.map((edge) => (edge.id === activeEdge.id ? { ...edge, label } : edge)));
            setSelected(null);
          }}
          onRemove={() => {
            onEdges(edges.filter((edge) => edge.id !== activeEdge.id));
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function AgentDialog({
  agent,
  onCancel,
  onSave,
  onRemove,
}: {
  agent: AgentNode;
  onCancel: () => void;
  onSave: (next: Pick<AgentNode, "name" | "role" | "model" | "tools" | "status">) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [model, setModel] = useState(agent.model);
  const [tools, setTools] = useState(agent.tools.join(", "));
  const [status, setStatus] = useState(agent.status);
  return (
    <NodeDialog
      title="Agent"
      onClose={onCancel}
      onSave={() =>
        onSave({
          name: name.trim() || "Agent",
          role: role.trim(),
          model: model.trim() || "gpt-4.1",
          tools: tools.split(",").map((item) => item.trim()).filter(Boolean),
          status,
        })
      }
    >
      <label className="text-[11px] text-muted">Name</label>
      <input className="input mt-1" value={name} onChange={(event) => setName(event.target.value)} />
      <label className="mt-3 block text-[11px] text-muted">Role</label>
      <textarea className="textarea mt-1 min-h-20" value={role} onChange={(event) => setRole(event.target.value)} />
      <label className="mt-3 block text-[11px] text-muted">Model</label>
      <input className="input mt-1" value={model} onChange={(event) => setModel(event.target.value)} />
      <label className="mt-3 block text-[11px] text-muted">Tools</label>
      <input className="input mt-1" value={tools} onChange={(event) => setTools(event.target.value)} />
      <div className="mt-3 flex flex-wrap gap-1">
        {STATUSES.map((item) => (
          <button
            key={item}
            type="button"
            className={`rounded-full px-2 py-1 text-[11px] ${status === item ? "bg-mint text-white" : "bg-panel-2 text-muted"}`}
            onClick={() => setStatus(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <button type="button" className="mt-3 flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-rose" onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5" /> Remove agent
      </button>
    </NodeDialog>
  );
}

function ConditionDialog({
  label,
  onCancel,
  onSave,
  onRemove,
}: {
  label: string;
  onCancel: () => void;
  onSave: (label: string) => void;
  onRemove: () => void;
}) {
  const [value, setValue] = useState(label);
  return (
    <NodeDialog title="Connection" onClose={onCancel} onSave={() => onSave(value.trim())}>
      <label className="text-[11px] text-muted">Condition</label>
      <input className="input mt-1" value={value} onChange={(event) => setValue(event.target.value)} />
      <button type="button" className="mt-3 flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-rose" onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5" /> Remove connection
      </button>
    </NodeDialog>
  );
}

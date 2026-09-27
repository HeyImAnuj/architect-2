"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { AppWorkflow, FlowEdge, FlowNode } from "@/lib/types";
import { uid } from "@/lib/utils";
import { CanvasBoard, NodeDialog, boardIconBtn } from "@/components/workspace/CanvasBoard";

export function seedWorkflow(prompt: string, mode: string): AppWorkflow {
  const nodes: FlowNode[] = [
    { id: "start", title: "Start", detail: "A person describes the job", x: 80, y: 280 },
    { id: "understand", title: "Understand", detail: prompt.slice(0, 110) || "Read the request", x: 380, y: 280 },
    {
      id: "work",
      title: mode === "pro" ? "Run the framework" : "Agents draft the result",
      detail: mode === "pro" ? "The chosen framework does the work" : "Specialists write the first version",
      x: 700,
      y: 140,
    },
    { id: "check", title: "Ask a person", detail: "Stop when the answer is uncertain", x: 700, y: 430 },
    { id: "show", title: "Show the app", detail: "The preview presents what was built", x: 1060, y: 280 },
  ];
  const edges: FlowEdge[] = [
    { id: "f1", from: "start", to: "understand", label: "when they send a request" },
    { id: "f2", from: "understand", to: "work", label: "if the request is clear" },
    { id: "f3", from: "understand", to: "check", label: "if it needs a person" },
    { id: "f4", from: "work", to: "show", label: "when the work is ready" },
    { id: "f5", from: "check", to: "show", label: "after they approve" },
  ];
  return { nodes, edges };
}

export function WorkflowCanvas({
  workflow,
  building,
  onChange,
  onBuild,
}: {
  workflow: AppWorkflow;
  building?: boolean;
  onChange: (workflow: AppWorkflow) => void;
  onBuild: () => void;
}) {
  const [board, setBoard] = useState(workflow);
  const boardRef = useRef(workflow);
  const [selected, setSelected] = useState<string | null>(null);
  const node = board.nodes.find((item) => item.id === selected);
  const edge = board.edges.find((item) => item.id === selected);

  useEffect(() => {
    boardRef.current = workflow;
    setBoard(workflow);
  }, [workflow]);

  function save(next: AppWorkflow) {
    boardRef.current = next;
    setBoard(next);
    onChange(next);
  }

  function connect(from: string, to: string) {
    if (board.edges.some((item) => item.from === from && item.to === to)) return;
    const next: FlowEdge = { id: uid("flow"), from, to, label: "then" };
    save({ ...board, edges: [...board.edges, next] });
    setSelected(next.id);
  }

  return (
    <div className="relative h-full min-h-0">
      <CanvasBoard
        width={1600}
        height={900}
        points={board.nodes}
        edges={board.edges}
        selectedId={selected}
        onMove={(id, x, y) => {
          const next = {
            ...boardRef.current,
            nodes: boardRef.current.nodes.map((step) => (step.id === id ? { ...step, x, y } : step)),
          };
          boardRef.current = next;
          setBoard(next);
        }}
        onMoveCommit={() => onChange(boardRef.current)}
        onConnect={connect}
        onNodeClick={setSelected}
        onEdgeClick={setSelected}
        actions={
          <>
            <button
              type="button"
              className={`${boardIconBtn} w-7`}
              aria-label="Add step"
              onClick={() => {
                const step: FlowNode = {
                  id: uid("step"),
                  title: "New step",
                  detail: "What happens here",
                  x: 160 + board.nodes.length * 36,
                  y: 200,
                };
                save({ ...board, nodes: [...board.nodes, step] });
                setSelected(step.id);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`${boardIconBtn} px-2 text-[11px] font-medium`}
              onClick={onBuild}
              disabled={building}
            >
              {building ? "…" : "Build"}
            </button>
          </>
        }
        renderCard={(id) => {
          const step = board.nodes.find((item) => item.id === id);
          if (!step) return null;
          return (
            <>
              <div className="truncate pr-2 text-sm font-semibold text-paper">{step.title}</div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">{step.detail}</p>
            </>
          );
        }}
      />
      {node && (
        <StepDialog
          key={node.id}
          node={node}
          onCancel={() => setSelected(null)}
          onSave={(title, detail) => {
            save({
              ...board,
              nodes: board.nodes.map((item) => (item.id === node.id ? { ...item, title, detail } : item)),
            });
            setSelected(null);
          }}
          onRemove={() => {
            save({
              nodes: board.nodes.filter((item) => item.id !== node.id),
              edges: board.edges.filter((item) => item.from !== node.id && item.to !== node.id),
            });
            setSelected(null);
          }}
        />
      )}
      {edge && (
        <EdgeDialog
          key={edge.id}
          label={edge.label || ""}
          noun="Connection"
          field="When"
          onCancel={() => setSelected(null)}
          onSave={(label) => {
            save({
              ...board,
              edges: board.edges.map((item) => (item.id === edge.id ? { ...item, label } : item)),
            });
            setSelected(null);
          }}
          onRemove={() => {
            save({ ...board, edges: board.edges.filter((item) => item.id !== edge.id) });
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function StepDialog({
  node,
  onCancel,
  onSave,
  onRemove,
}: {
  node: FlowNode;
  onCancel: () => void;
  onSave: (title: string, detail: string) => void;
  onRemove: () => void;
}) {
  const [title, setTitle] = useState(node.title);
  const [detail, setDetail] = useState(node.detail);
  return (
    <NodeDialog title="Step" onClose={onCancel} onSave={() => onSave(title.trim() || "New step", detail.trim())}>
      <label className="text-[11px] text-muted">Name</label>
      <input className="input mt-1" value={title} onChange={(event) => setTitle(event.target.value)} />
      <label className="mt-3 block text-[11px] text-muted">What happens</label>
      <textarea className="textarea mt-1 min-h-24" value={detail} onChange={(event) => setDetail(event.target.value)} />
      <button type="button" className="mt-3 flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-rose" onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5" /> Remove step
      </button>
    </NodeDialog>
  );
}

function EdgeDialog({
  label,
  noun,
  field,
  removeLabel,
  onCancel,
  onSave,
  onRemove,
}: {
  label: string;
  noun: string;
  field: string;
  removeLabel?: string;
  onCancel: () => void;
  onSave: (label: string) => void;
  onRemove: () => void;
}) {
  const [value, setValue] = useState(label);
  return (
    <NodeDialog title={noun} onClose={onCancel} onSave={() => onSave(value.trim())}>
      <label className="text-[11px] text-muted">{field}</label>
      <input className="input mt-1" value={value} onChange={(event) => setValue(event.target.value)} />
      <button type="button" className="mt-3 flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-rose" onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5" /> {removeLabel || "Remove connection"}
      </button>
    </NodeDialog>
  );
}

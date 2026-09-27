"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Minus, Plus, X } from "lucide-react";

const CARD_W = 208;
const CARD_H = 96;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.8;

export type BoardEdge = { id: string; from: string; to: string; label?: string };
export type BoardPoint = { id: string; x: number; y: number };

const iconBtn =
  "flex h-7 items-center justify-center rounded-md border border-[#eceef2] bg-white text-paper shadow-sm hover:bg-panel-2";

export function NodeDialog({
  title,
  onClose,
  onSave,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <form
        className="panel w-full max-w-md p-4"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && (event.target as HTMLElement).tagName === "TEXTAREA") {
            event.preventDefault();
            event.currentTarget.requestSubmit();
          }
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-paper">{title}</h3>
          <button type="button" className={`${iconBtn} w-7`} aria-label="Close" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {children}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="h-8 rounded-md px-3 text-[13px] text-muted hover:bg-panel-2" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="h-8 rounded-md bg-mint px-3 text-[13px] font-medium text-white">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export function CanvasBoard({
  width,
  height,
  points,
  edges,
  selectedId,
  onMove,
  onMoveCommit,
  onConnect,
  onNodeClick,
  onEdgeClick,
  renderCard,
  actions,
}: {
  width: number;
  height: number;
  points: BoardPoint[];
  edges: BoardEdge[];
  selectedId?: string | null;
  onMove: (id: string, x: number, y: number) => void;
  onMoveCommit: () => void;
  onConnect: (from: string, to: string) => void;
  onNodeClick: (id: string) => void;
  onEdgeClick: (id: string) => void;
  renderCard: (id: string) => ReactNode;
  actions?: ReactNode;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef({ zoom: 1, panX: 40, panY: 32 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 32 });
  const [wire, setWire] = useState<{ from: string; x: number; y: number } | null>(null);

  viewRef.current = { zoom, panX: pan.x, panY: pan.y };

  const worldW = Math.max(width, ...points.map((point) => point.x + CARD_W + 160), 800);
  const worldH = Math.max(height, ...points.map((point) => point.y + 220), 560);

  function toWorld(clientX: number, clientY: number) {
    const rect = viewportRef.current?.getBoundingClientRect();
    const view = viewRef.current;
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - view.panX) / view.zoom,
      y: (clientY - rect.top - view.panY) / view.zoom,
    };
  }

  function zoomAround(nextZoom: number, anchorX: number, anchorY: number) {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
    const worldX = (anchorX - pan.x) / zoom;
    const worldY = (anchorY - pan.y) / zoom;
    setZoom(next);
    setPan({ x: anchorX - worldX * next, y: anchorY - worldY * next });
  }

  function zoomBy(factor: number) {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    zoomAround(zoom * factor, rect.width / 2, rect.height / 2);
  }

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      const view = viewRef.current;
      const factor = event.deltaY < 0 ? 1.08 : 0.92;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.zoom * factor));
      const anchorX = event.clientX - rect.left;
      const anchorY = event.clientY - rect.top;
      const worldX = (anchorX - view.panX) / view.zoom;
      const worldY = (anchorY - view.panY) / view.zoom;
      setZoom(next);
      setPan({ x: anchorX - worldX * next, y: anchorY - worldY * next });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  function startPan(event: ReactPointerEvent) {
    if (event.button !== 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = viewRef.current.panX;
    const originY = viewRef.current.panY;
    const move = (ev: PointerEvent) => {
      setPan({ x: originX + ev.clientX - startX, y: originY + ev.clientY - startY });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startDrag(point: BoardPoint, event: ReactPointerEvent) {
    if (event.button !== 0) return;
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = point.x;
    const originY = point.y;
    let moved = false;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / viewRef.current.zoom;
      const dy = (ev.clientY - startY) / viewRef.current.zoom;
      if (Math.hypot(dx, dy) > 3) moved = true;
      onMove(point.id, Math.max(8, originX + dx), Math.max(8, originY + dy));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (moved) onMoveCommit();
      else onNodeClick(point.id);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startLink(fromId: string, event: ReactPointerEvent) {
    event.stopPropagation();
    event.preventDefault();
    const place = (clientX: number, clientY: number) => {
      const point = toWorld(clientX, clientY);
      setWire({ from: fromId, x: point.x, y: point.y });
    };
    place(event.clientX, event.clientY);
    const move = (ev: PointerEvent) => place(ev.clientX, ev.clientY);
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const point = toWorld(ev.clientX, ev.clientY);
      const target = points.find(
        (item) =>
          item.id !== fromId &&
          point.x >= item.x - 12 &&
          point.x <= item.x + CARD_W + 12 &&
          point.y >= item.y - 12 &&
          point.y <= item.y + CARD_H + 12,
      );
      setWire(null);
      if (target) onConnect(fromId, target.id);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function curve(x1: number, y1: number, x2: number, y2: number) {
    const bend = Math.max(48, Math.abs(x2 - x1) / 2);
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
  }

  return (
    <div ref={viewportRef} className="relative h-full min-h-0 overflow-hidden bg-[radial-gradient(circle,rgba(79,70,229,0.16)_1px,transparent_1px)] [background-size:22px_22px]">
      <div
        data-surface="board"
        className="absolute left-0 top-0"
        style={{ width: worldW, height: worldH, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
        onPointerDown={startPan}
      >
        <svg className="absolute left-0 top-0" width={worldW} height={worldH} style={{ pointerEvents: "none" }}>
          {edges.map((edge) => {
            const from = points.find((point) => point.id === edge.from);
            const to = points.find((point) => point.id === edge.to);
            if (!from || !to) return null;
            const x1 = from.x + CARD_W;
            const y1 = from.y + 36;
            const x2 = to.x;
            const y2 = to.y + 36;
            const d = curve(x1, y1, x2, y2);
            const labelX = (x1 + x2) / 2;
            const labelY = (y1 + y2) / 2;
            return (
              <g key={edge.id} style={{ pointerEvents: "auto" }}>
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  className="cursor-pointer"
                  style={{ pointerEvents: "stroke" }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => onEdgeClick(edge.id)}
                />
                <path d={d} fill="none" stroke={selectedId === edge.id ? "#818cf8" : "#64748b"} strokeWidth="1.75" />
                {edge.label && (
                  <text x={labelX} y={labelY - 8} textAnchor="middle" fill="#a8b1c0" fontSize="11">
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
          {wire && (() => {
            const from = points.find((point) => point.id === wire.from);
            if (!from) return null;
            return (
              <path
                d={curve(from.x + CARD_W, from.y + 36, wire.x, wire.y)}
                fill="none"
                stroke="#818cf8"
                strokeWidth="1.75"
                strokeDasharray="5 4"
              />
            );
          })()}
        </svg>
        {points.map((point) => (
          <div
            key={point.id}
            className={`absolute w-[208px] rounded-2xl border bg-panel px-3 py-2.5 text-left shadow-lg ${
              selectedId === point.id ? "border-mint" : "border-line"
            }`}
            style={{ left: point.x, top: point.y }}
            onPointerDown={(event) => startDrag(point, event)}
          >
            <span
              className="absolute -left-1.5 top-7 h-3 w-3 cursor-crosshair rounded-full border-2 border-mint bg-panel"
              onPointerDown={(event) => startLink(point.id, event)}
            />
            {renderCard(point.id)}
            <span
              className="absolute -right-1.5 top-7 h-3 w-3 cursor-crosshair rounded-full border-2 border-mint bg-panel"
              onPointerDown={(event) => startLink(point.id, event)}
            />
          </div>
        ))}
      </div>
      {actions && <div className="absolute right-3 top-3 flex items-center gap-1">{actions}</div>}
      <div className="absolute bottom-3 right-3 flex flex-col items-center gap-1">
        <button type="button" className={`${iconBtn} w-7`} aria-label="Zoom in" onClick={() => zoomBy(1.12)}>
          <Plus className="h-3.5 w-3.5" />
        </button>
        <span className="w-7 text-center text-[10px] tabular-nums text-muted">{Math.round(zoom * 100)}</span>
        <button type="button" className={`${iconBtn} w-7`} aria-label="Zoom out" onClick={() => zoomBy(0.88)}>
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export const boardIconBtn = iconBtn;

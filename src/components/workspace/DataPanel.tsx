"use client";

import { useEffect, useState } from "react";
import { clientApi } from "@/lib/client-api";

export function DataPanel({ projectId }: { projectId: string }) {
  const [tables, setTables] = useState<
    Record<string, { id: string; createdAt: number; data: Record<string, unknown> }[]>
  >({});
  const [active, setActive] = useState<string>("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const result = await clientApi.records(projectId);
    setTables(result.tables);
    const names = Object.keys(result.tables);
    setActive((current) => current || names[0] || "notes");
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : "Could not load data"),
    );
  }, [projectId]);

  const rows = tables[active] || [];
  const columns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row.data || {}))),
  );

  return (
    <div className="flex h-full flex-col p-4">
      <div>
        <div className="text-sm font-semibold text-paper">Your app’s data</div>
        <p className="mt-1 text-xs text-muted">
          Real rows stored in Postgres. Add a note and it stays even after you refresh.
        </p>
      </div>
      {error && <p className="mt-3 text-sm text-rose">{error}</p>}
      <div className="mt-4 flex min-h-0 flex-1 gap-3">
        <div className="w-40 shrink-0 space-y-1">
          {Object.keys(tables).length === 0 && (
            <button className="chip" onClick={() => setActive("notes")}>
              notes
            </button>
          )}
          {Object.keys(tables).map((name) => (
            <button
              key={name}
              onClick={() => setActive(name)}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${
                active === name ? "bg-mint/10 text-mint" : "text-muted hover:bg-panel-2"
              }`}
            >
              {name}
              <span className="ml-2 text-xs">{tables[name].length}</span>
            </button>
          ))}
        </div>
        <div className="min-w-0 flex-1 overflow-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-3 py-2 font-semibold">
                    {column}
                  </th>
                ))}
                {columns.length === 0 && <th className="px-3 py-2">No rows yet</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  {columns.map((column) => (
                    <td key={column} className="px-3 py-2 text-paper">
                      {String(row.data[column] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!note.trim()) return;
          await clientApi.addRecord(projectId, active || "notes", { note });
          setNote("");
          await load();
        }}
      >
        <input
          className="input"
          placeholder={`Add a row to ${active || "notes"}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="btn btn-primary">Save row</button>
      </form>
    </div>
  );
}

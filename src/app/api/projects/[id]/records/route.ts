import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { error, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const owned = await db
    .prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?")
    .get(id, user.id);
  if (!owned) return error("Not found", 404);

  const rows = await db
    .prepare(
      "SELECT id, table_name, row_json, created_at FROM app_records WHERE project_id = ? ORDER BY created_at DESC",
    )
    .all(id);

  const tables: Record<string, { id: string; createdAt: number; data: unknown }[]> = {};
  for (const row of rows as {
    id: string;
    table_name: string;
    row_json: string;
    created_at: string | number;
  }[]) {
    const name = row.table_name;
    tables[name] ||= [];
    tables[name].push({
      id: row.id,
      createdAt: Number(row.created_at),
      data: JSON.parse(row.row_json),
    });
  }
  return json({ tables });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const owned = await db
    .prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?")
    .get(id, user.id);
  if (!owned) return error("Not found", 404);

  const body = await req.json().catch(() => ({}));
  const table = String(body.table || "notes").replace(/[^a-z0-9_]/gi, "").slice(0, 40) || "notes";
  const data = body.data ?? { note: "New row" };
  await db
    .prepare(
      "INSERT INTO app_records (id, project_id, table_name, row_json, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(newId("row"), id, table, JSON.stringify(data), Date.now());
  return json({ ok: true });
}

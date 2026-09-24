import { NextRequest } from "next/server";
import JSZip from "jszip";
import { getSessionUser } from "@/lib/auth";
import { db, type DbProject } from "@/lib/db";
import { error } from "@/lib/api";
import type { CodeFile } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(id, user.id) as DbProject | undefined;
  if (!row) return error("Not found", 404);

  const files = JSON.parse(row.files_json || "[]") as CodeFile[];
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.path, f.content);
  }
  zip.file("preview.html", row.preview_html || "");
  zip.file(
    "architect.meta.json",
    JSON.stringify(
      {
        name: row.name,
        framework: row.framework,
        prompt: row.prompt,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  const filename = `${row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project"}.zip`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

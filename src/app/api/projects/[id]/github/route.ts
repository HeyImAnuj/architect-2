import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, type DbProject } from "@/lib/db";
import { error, json } from "@/lib/api";
import { toClientProject } from "@/lib/project-mapper";
import type { CodeFile } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(id, user.id) as DbProject | undefined;
  if (!row) return error("Not found", 404);

  const body = await req.json().catch(() => ({}));
  const repo = String(body.repo || "").trim();
  if (!repo || !repo.includes("/")) return error("Use org/repo format");

  const token = process.env.GITHUB_TOKEN;
  let gistUrl: string | undefined;
  let pushed = false;

  if (token) {
    const files = JSON.parse(row.files_json || "[]") as CodeFile[];
    const gistFiles: Record<string, { content: string }> = {};
    for (const f of files.slice(0, 8)) {
      const key = f.path.replace(/[\\/]/g, "__");
      gistFiles[key] = { content: f.content };
    }
    gistFiles["preview.html"] = { content: row.preview_html || "<!-- empty -->" };
    try {
      const res = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: `${row.name} — exported from Architect 2.0 (${repo})`,
          public: true,
          files: gistFiles,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        gistUrl = data.html_url;
        pushed = true;
      }
    } catch {
      // fall through — still connect locally
    }
  }

  db.prepare(
    `UPDATE projects SET github_connected = 1, github_repo = ?, updated_at = ? WHERE id = ?`,
  ).run(repo, Date.now(), id);

  const updated = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(id) as DbProject;

  return json({
    project: toClientProject(updated),
    gistUrl,
    pushed,
    message: pushed
      ? "Connected and published a GitHub gist with your source."
      : "Connected repository locally. Add GITHUB_TOKEN to push a real gist.",
  });
}

import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, newId, type DbProject } from "@/lib/db";
import { error, json } from "@/lib/api";
import { toClientProject } from "@/lib/project-mapper";

type Ctx = { params: Promise<{ id: string }> };

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "app"
  );
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(id, user.id) as DbProject | undefined;
  if (!row) return error("Not found", 404);

  const body = await req.json().catch(() => ({}));
  const env = String(body.env || "preview");
  const region = String(body.region || "us-east");

  const base = slugify(row.name);
  const slug = `${base}-${row.id.slice(-6)}`;
  const origin = req.nextUrl.origin;
  const deployUrl = `${origin}/a/${slug}`;
  const now = Date.now();

  const existing = db
    .prepare("SELECT id FROM published_apps WHERE slug = ?")
    .get(slug) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE published_apps SET html = ?, name = ?, updated_at = ? WHERE slug = ?`,
    ).run(row.preview_html, row.name, now, slug);
  } else {
    db.prepare(
      `INSERT INTO published_apps (id, slug, user_id, project_id, name, html, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(newId("pub"), slug, user.id, row.id, row.name, row.preview_html, now, now);
  }

  db.prepare(
    `UPDATE projects SET deployed = 1, deploy_url = ?, deploy_slug = ?, phase = 'ready', updated_at = ?
     WHERE id = ?`,
  ).run(deployUrl, slug, now, id);

  const updated = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(id) as DbProject;

  return json({
    project: toClientProject(updated),
    deployUrl,
    meta: { env, region },
  });
}

import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, type DbProject } from "@/lib/db";
import { error, json } from "@/lib/api";
import { toClientProject } from "@/lib/project-mapper";
import type { Project } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

function getOwned(id: string, userId: string) {
  return db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(id, userId) as DbProject | undefined;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = getOwned(id, user.id);
  if (!row) return error("Not found", 404);
  return json({ project: toClientProject(row) });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = getOwned(id, user.id);
  if (!row) return error("Not found", 404);
  const patch = (await req.json().catch(() => ({}))) as Partial<Project>;

  const next = {
    name: patch.name ?? row.name,
    description: patch.description ?? row.description,
    prompt: patch.prompt ?? row.prompt,
    framework: patch.framework ?? row.framework,
    mode: patch.mode ?? row.mode,
    phase: patch.phase ?? row.phase,
    github_connected:
      patch.githubConnected !== undefined
        ? patch.githubConnected
          ? 1
          : 0
        : row.github_connected,
    github_repo:
      patch.githubRepo !== undefined ? patch.githubRepo : row.github_repo,
    deployed:
      patch.deployed !== undefined ? (patch.deployed ? 1 : 0) : row.deployed,
    deploy_url: patch.deployUrl !== undefined ? patch.deployUrl : row.deploy_url,
    deploy_slug:
      patch.deploySlug !== undefined ? patch.deploySlug : row.deploy_slug,
    agents_json:
      patch.agents !== undefined ? JSON.stringify(patch.agents) : row.agents_json,
    edges_json:
      patch.edges !== undefined ? JSON.stringify(patch.edges) : row.edges_json,
    messages_json:
      patch.messages !== undefined
        ? JSON.stringify(patch.messages)
        : row.messages_json,
    files_json:
      patch.files !== undefined ? JSON.stringify(patch.files) : row.files_json,
    knowledge_json:
      patch.knowledgeFiles !== undefined
        ? JSON.stringify(patch.knowledgeFiles)
        : row.knowledge_json,
    preview_html: patch.previewHtml ?? row.preview_html,
    traces_json:
      patch.traces !== undefined ? JSON.stringify(patch.traces) : row.traces_json,
    updated_at: Date.now(),
  };

  db.prepare(
    `UPDATE projects SET
      name=?, description=?, prompt=?, framework=?, mode=?, phase=?,
      github_connected=?, github_repo=?, deployed=?, deploy_url=?, deploy_slug=?,
      agents_json=?, edges_json=?, messages_json=?, files_json=?, knowledge_json=?,
      preview_html=?, traces_json=?, updated_at=?
     WHERE id=? AND user_id=?`,
  ).run(
    next.name,
    next.description,
    next.prompt,
    next.framework,
    next.mode,
    next.phase,
    next.github_connected,
    next.github_repo,
    next.deployed,
    next.deploy_url,
    next.deploy_slug,
    next.agents_json,
    next.edges_json,
    next.messages_json,
    next.files_json,
    next.knowledge_json,
    next.preview_html,
    next.traces_json,
    next.updated_at,
    id,
    user.id,
  );

  const updated = getOwned(id, user.id)!;
  return json({ project: toClientProject(updated) });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = getOwned(id, user.id);
  if (!row) return error("Not found", 404);
  db.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").run(id, user.id);
  return json({ ok: true });
}

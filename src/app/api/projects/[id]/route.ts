import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, newId, type DbProject } from "@/lib/db";
import { error, json } from "@/lib/api";
import { toClientProject } from "@/lib/project-mapper";
import { rewriteFrameworkSource } from "@/lib/llm";
import type { ChatMessage, CodeFile, FrameworkId, Project } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

async function getOwned(id: string, userId: string) {
  return (await db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(id, userId)) as DbProject | undefined;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = await getOwned(id, user.id);
  if (!row) return error("Not found", 404);
  return json({ project: toClientProject(row) });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = await getOwned(id, user.id);
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
    visibility: patch.visibility ?? row.visibility,
    connectors_json:
      patch.connectors !== undefined
        ? JSON.stringify(patch.connectors)
        : row.connectors_json,
    updated_at: Date.now(),
  };

  if (patch.framework && patch.framework !== row.framework && row.prompt && row.phase !== "planning") {
    const currentFiles = JSON.parse(row.files_json || "[]") as CodeFile[];
    const rewritten = await rewriteFrameworkSource({
      framework: patch.framework as FrameworkId,
      prompt: row.prompt,
      files: currentFiles,
    });
    if (rewritten) {
      next.files_json = JSON.stringify(rewritten);
      const messages = JSON.parse(next.messages_json) as ChatMessage[];
      messages.push({
        id: newId("msg"),
        role: "architect",
        content: `Rewrote the project source for ${patch.framework}.`,
        timestamp: Date.now(),
        meta: "Framework",
      });
      next.messages_json = JSON.stringify(messages);
    }
  }

  await db.prepare(
    `UPDATE projects SET
      name=?, description=?, prompt=?, framework=?, mode=?, phase=?,
      github_connected=?, github_repo=?, deployed=?, deploy_url=?, deploy_slug=?,
      agents_json=?, edges_json=?, messages_json=?, files_json=?, knowledge_json=?,
      preview_html=?, traces_json=?, visibility=?, connectors_json=?, updated_at=?
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
    next.visibility,
    next.connectors_json,
    next.updated_at,
    id,
    user.id,
  );

  const updated = (await getOwned(id, user.id))!;
  return json({ project: toClientProject(updated) });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = await getOwned(id, user.id);
  if (!row) return error("Not found", 404);
  await db.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").run(id, user.id);
  return json({ ok: true });
}

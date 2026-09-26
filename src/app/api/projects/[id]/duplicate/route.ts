import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, newId, type DbProject } from "@/lib/db";
import { error, json } from "@/lib/api";
import { toClientProject } from "@/lib/project-mapper";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = (await db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(id, user.id)) as DbProject | undefined;
  if (!row) return error("Not found", 404);

  const copyId = newId("proj");
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO projects (
        id, user_id, name, description, prompt, framework, mode, phase,
        github_connected, github_repo, deployed, deploy_url, deploy_slug,
        agents_json, edges_json, messages_json, files_json, knowledge_json,
        preview_html, traces_json, plan_json, answers_json, skill_md, env_json,
        connectors_json, visibility, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, 0, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      copyId,
      user.id,
      `${row.name} copy`,
      row.description,
      row.prompt,
      row.framework,
      row.mode,
      row.phase,
      row.agents_json,
      row.edges_json,
      row.messages_json,
      row.files_json,
      row.knowledge_json,
      row.preview_html,
      row.traces_json,
      row.plan_json,
      row.answers_json,
      row.skill_md,
      row.env_json,
      row.connectors_json,
      "private",
      now,
      now,
    );

  const created = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(copyId)) as DbProject;
  return json({ project: toClientProject(created) });
}

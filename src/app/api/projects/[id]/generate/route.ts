import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, newId, type DbProject } from "@/lib/db";
import { error, json } from "@/lib/api";
import { toClientProject } from "@/lib/project-mapper";
import { buildPlanArtifacts } from "@/lib/plan";
import { buildApp } from "@/lib/llm";
import type { FrameworkId, KnowledgeFile } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = (await db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(id, user.id)) as DbProject | undefined;
  if (!row) return error("Not found", 404);

  const body = await req.json().catch(() => ({}));
  const answers = (body.answers || {}) as Record<string, string | string[]>;
  const artifacts = buildPlanArtifacts({
    name: row.name,
    prompt: row.prompt,
    answers,
  });

  const knowledge = JSON.parse(row.knowledge_json || "[]") as KnowledgeFile[];
  const generated = await buildApp({
    prompt: `${row.prompt}\n\nPlan:\n${artifacts.plan}`,
    framework: row.framework as FrameworkId,
    seed: id,
    knowledge,
  });

  const now = Date.now();
  await db
    .prepare(
      `UPDATE projects SET
        phase = 'ready',
        answers_json = ?,
        plan_json = ?,
        skill_md = ?,
        agents_json = ?,
        edges_json = ?,
        files_json = ?,
        preview_html = ?,
        traces_json = ?,
        messages_json = ?,
        updated_at = ?
       WHERE id = ? AND user_id = ?`,
    )
    .run(
      JSON.stringify(answers),
      artifacts.plan,
      artifacts.skill,
      JSON.stringify(generated.agents),
      JSON.stringify(generated.edges),
      JSON.stringify([
        ...generated.files,
        { path: "PLAN.md", language: "markdown", content: artifacts.plan },
        { path: "SKILL.md", language: "markdown", content: artifacts.skill },
      ]),
      generated.previewHtml,
      JSON.stringify(generated.traces),
      JSON.stringify(generated.messages),
      now,
      id,
      user.id,
    );

  if (String(answers.memory) !== "no") {
    await db
      .prepare(
        "INSERT INTO app_records (id, project_id, table_name, row_json, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        newId("row"),
        id,
        "decisions",
        JSON.stringify({
          status: "ready",
          summary: row.name,
          authority: answers.authority || "approval",
        }),
        now,
      );
  }

  const updated = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(id)) as DbProject;
  return json({ project: toClientProject(updated) });
}

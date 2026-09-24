import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, newId, type DbProject } from "@/lib/db";
import { error, json } from "@/lib/api";
import { toClientProject, emptyProjectFields } from "@/lib/project-mapper";
import {
  generateProjectFromPrompt,
  maybeEnhanceWithOpenAI,
  buildPreviewHtml,
  buildFiles,
} from "@/lib/generator";
import type { FrameworkId, AudienceMode, KnowledgeFile } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const rows = db
    .prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC")
    .all(user.id) as DbProject[];
  return json({ projects: rows.map(toClientProject) });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const body = await req.json().catch(() => ({}));

  const prompt = String(body.prompt || "").trim();
  const framework = (body.framework || "lyzr") as FrameworkId;
  const mode = (body.mode || "soft") as AudienceMode;
  const source = body.source || "prompt";
  const now = Date.now();
  const id = newId("proj");

  if (source === "blank") {
    const name = body.name?.trim() || "Blank Canvas";
    const previewHtml = buildPreviewHtml({
      name,
      prompt: "Blank agentic canvas — describe what you want in chat.",
      agents: [],
      knowledge: [],
    });
    const files = buildFiles(name, "Blank canvas", framework, []);
    const messages = [
      {
        id: newId("msg"),
        role: "architect",
        content:
          "Blank canvas ready. Describe an outcome in Soft mode, or edit Files in Pro mode.",
        timestamp: now,
      },
    ];
    db.prepare(
      `INSERT INTO projects (
        id, user_id, name, description, prompt, framework, mode, phase,
        github_connected, github_repo, deployed, deploy_url, deploy_slug,
        agents_json, edges_json, messages_json, files_json, knowledge_json,
        preview_html, traces_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'intent', 0, NULL, 0, NULL, NULL, '[]', '[]', ?, ?, '[]', ?, '[]', ?, ?)`,
    ).run(
      id,
      user.id,
      name,
      "Blank agentic canvas",
      "",
      framework,
      mode,
      JSON.stringify(messages),
      JSON.stringify(files),
      previewHtml,
      now,
      now,
    );
    const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as DbProject;
    return json({ project: toClientProject(row) });
  }

  if (source === "import-github") {
    const repo = String(body.githubRepo || "acme/imported-app");
    const name = repo.split("/").pop() || "Imported App";
    const generated = generateProjectFromPrompt({
      prompt: prompt || `Continue building imported repository ${repo}`,
      framework,
      seed: id,
    });
    generated.messages.unshift({
      id: newId("msg"),
      role: "system",
      content: `Imported ${repo}. Mapped structure into Architect and generated an agent graph you can keep editing.`,
      timestamp: now,
      meta: "Import",
    });
    db.prepare(
      `INSERT INTO projects (
        id, user_id, name, description, prompt, framework, mode, phase,
        github_connected, github_repo, deployed, deploy_url, deploy_slug,
        agents_json, edges_json, messages_json, files_json, knowledge_json,
        preview_html, traces_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, NULL, NULL, ?, ?, ?, ?, '[]', ?, ?, ?, ?)`,
    ).run(
      id,
      user.id,
      name,
      generated.description,
      generated.messages.find((m) => m.role === "user")?.content || prompt,
      framework,
      mode,
      generated.phase,
      repo,
      JSON.stringify(generated.agents),
      JSON.stringify(generated.edges),
      JSON.stringify(generated.messages),
      JSON.stringify(generated.files),
      generated.previewHtml,
      JSON.stringify(generated.traces),
      now,
      now,
    );
    const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as DbProject;
    return json({ project: toClientProject(row) });
  }

  if (source === "import-zip") {
    const zipText = String(body.zipText || "");
    const name = body.name?.trim() || "Imported Zip Project";
    const generated = generateProjectFromPrompt({
      prompt:
        prompt ||
        `Imported local project archive. ${zipText.slice(0, 200) || "Continue building in Architect."}`,
      framework,
      seed: id,
    });
    db.prepare(
      `INSERT INTO projects (
        id, user_id, name, description, prompt, framework, mode, phase,
        github_connected, github_repo, deployed, deploy_url, deploy_slug,
        agents_json, edges_json, messages_json, files_json, knowledge_json,
        preview_html, traces_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, 0, NULL, NULL, ?, ?, ?, ?, '[]', ?, ?, ?, ?)`,
    ).run(
      id,
      user.id,
      name,
      generated.description,
      generated.messages.find((m) => m.role === "user")?.content || prompt,
      framework,
      mode,
      generated.phase,
      JSON.stringify(generated.agents),
      JSON.stringify(generated.edges),
      JSON.stringify(generated.messages),
      JSON.stringify(generated.files),
      generated.previewHtml,
      JSON.stringify(generated.traces),
      now,
      now,
    );
    const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as DbProject;
    return json({ project: toClientProject(row) });
  }

  if (!prompt) return error("Prompt is required");

  const generated = generateProjectFromPrompt({
    prompt,
    framework,
    seed: id,
  });
  generated.previewHtml = await maybeEnhanceWithOpenAI(prompt, generated.previewHtml);
  if (body.name) generated.name = String(body.name);

  const fields = emptyProjectFields();
  db.prepare(
    `INSERT INTO projects (
      id, user_id, name, description, prompt, framework, mode, phase,
      github_connected, github_repo, deployed, deploy_url, deploy_slug,
      agents_json, edges_json, messages_json, files_json, knowledge_json,
      preview_html, traces_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'intent', 0, NULL, 0, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    user.id,
    generated.name,
    generated.description,
    prompt,
    framework,
    mode,
    fields.agents_json,
    fields.edges_json,
    JSON.stringify([
      {
        id: newId("msg"),
        role: "user",
        content: prompt,
        timestamp: now,
      },
      {
        id: newId("msg"),
        role: "architect",
        content: "Got it — planning the agent graph and generating your app…",
        timestamp: now + 1,
      },
    ]),
    fields.files_json,
    fields.knowledge_json,
    buildPreviewHtml({
      name: generated.name,
      prompt,
      agents: [],
    }),
    fields.traces_json,
    now,
    now,
  );

  // Persist full generation immediately; client animates phases
  db.prepare(
    `UPDATE projects SET
      phase = ?, agents_json = ?, edges_json = ?, messages_json = ?,
      files_json = ?, preview_html = ?, traces_json = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
  ).run(
    generated.phase,
    JSON.stringify(generated.agents),
    JSON.stringify(generated.edges),
    JSON.stringify(generated.messages),
    JSON.stringify(generated.files),
    generated.previewHtml,
    JSON.stringify(generated.traces),
    Date.now(),
    id,
    user.id,
  );

  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as DbProject;
  return json({ project: toClientProject(row), generated: true });
}

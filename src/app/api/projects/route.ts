import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, newId, type DbProject } from "@/lib/db";
import { error, json } from "@/lib/api";
import { toClientProject } from "@/lib/project-mapper";
import { buildPreviewHtml, buildFiles } from "@/lib/generator";
import { buildApp } from "@/lib/llm";
import { fetchRepoFiles } from "@/lib/github";
import { filesFromZip, previewFromFiles } from "@/lib/import-files";
import { decryptSecret } from "@/lib/secrets";
import type { CodeFile, FrameworkId, AudienceMode } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const rows = await db.prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC")
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
    await db.prepare(
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
    const row = await db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as DbProject;
    return json({ project: toClientProject(row) });
  }

  if (source === "import-github" || source === "import-zip") {
    const repo = String(body.githubRepo || "").trim();
    let files: CodeFile[] = [];
    let name = body.name?.trim() || "Imported project";
    let githubRepo: string | null = null;
    if (source === "import-github") {
      if (!repo.includes("/")) return error("Use org/repo for a GitHub import");
      name = repo.split("/").pop() || name;
      githubRepo = repo;
      const account = (await db
        .prepare("SELECT github_token FROM users WHERE id = ?")
        .get(user.id)) as { github_token: string | null } | undefined;
      const token = account?.github_token ? decryptSecret(account.github_token) : null;
      try {
        files = await fetchRepoFiles(repo, token);
      } catch (err) {
        return error(err instanceof Error ? err.message : "Could not read that repository", 400);
      }
      if (!files.length) return error("That repository has no text files Architect can import.", 400);
    } else {
      const zipBase64 = String(body.zipBase64 || "");
      if (!zipBase64) return error("Choose a zip file to import.");
      try {
        files = await filesFromZip(zipBase64);
      } catch {
        return error("That file is not a readable zip.", 400);
      }
      if (!files.length) return error("The zip did not contain any project files.", 400);
      name = body.name?.trim() || files[0]?.path.split("/")[0] || "Imported zip";
    }

    const built = await buildApp({
      prompt: `${prompt}\n\nImported files:\n${files.map((file) => file.path).join("\n")}`,
      framework,
      seed: id,
    });
    built.files = files;
    built.previewHtml = built.usedModel ? built.previewHtml : previewFromFiles(name, files);
    built.name = name;
    built.messages.unshift({
      id: newId("msg"),
      role: "system",
      content: source === "import-github" ? `Imported ${repo} into the studio.` : "Imported the zip into the studio.",
      timestamp: now,
      meta: "Import",
    });

    await db.prepare(
      `INSERT INTO projects (
        id, user_id, name, description, prompt, framework, mode, phase,
        github_connected, github_repo, deployed, deploy_url, deploy_slug,
        agents_json, edges_json, messages_json, files_json, knowledge_json,
        preview_html, traces_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?, ?, ?, '[]', ?, ?, ?, ?)`,
    ).run(
      id,
      user.id,
      name,
      built.description,
      prompt || `Imported ${name}`,
      framework,
      mode,
      "ready",
      githubRepo ? 1 : 0,
      githubRepo,
      JSON.stringify(built.agents),
      JSON.stringify(built.edges),
      JSON.stringify(built.messages),
      JSON.stringify(files),
      built.previewHtml,
      JSON.stringify(built.traces),
      now,
      now,
    );
    const row = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(id)) as DbProject;
    return json({ project: toClientProject(row) });
  }

  if (!prompt) return error("Prompt is required");

  const name = prompt
    .replace(/^(build|create|make)\s+/i, "")
    .split(/\s+/)
    .slice(0, 5)
    .join(" ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase())
    .slice(0, 60) || "New app";

  const messages = [
    {
      id: newId("msg"),
      role: "user",
      content: prompt,
      timestamp: now,
    },
    {
      id: newId("msg"),
      role: "architect",
      content:
        "Before I build anything, I'll ask a few short questions so the app matches how your team actually works.",
      timestamp: now + 1,
      meta: "Planning",
    },
  ];

  await db
    .prepare(
      `INSERT INTO projects (
        id, user_id, name, description, prompt, framework, mode, phase,
        github_connected, github_repo, deployed, deploy_url, deploy_slug,
        agents_json, edges_json, messages_json, files_json, knowledge_json,
        preview_html, traces_json, connectors_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'planning', 0, NULL, 0, NULL, NULL, '[]', '[]', ?, '[]', '[]', '', '[]', ?, ?, ?)`,
    )
    .run(
      id,
      user.id,
      name,
      prompt.slice(0, 160),
      prompt,
      framework,
      mode,
      JSON.stringify(messages),
      JSON.stringify(Array.isArray(body.connectors) ? body.connectors : []),
      now,
      now,
    );

  const row = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(id)) as DbProject;
  return json({ project: toClientProject(row), planning: true });
}

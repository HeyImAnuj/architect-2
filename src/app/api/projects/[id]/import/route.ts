import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, newId, type DbProject } from "@/lib/db";
import { error, json } from "@/lib/api";
import { toClientProject } from "@/lib/project-mapper";
import { fetchRepoFiles } from "@/lib/github";
import { previewFromFiles } from "@/lib/import-files";
import { decryptSecret } from "@/lib/secrets";
import type { ChatMessage } from "@/lib/types";

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
  const repo = String(body.repo || "").trim();
  if (!repo.includes("/")) return error("Choose a repository.");

  const account = (await db
    .prepare("SELECT github_token FROM users WHERE id = ?")
    .get(user.id)) as { github_token: string | null } | undefined;
  const token = account?.github_token ? decryptSecret(account.github_token) : null;

  try {
    const files = await fetchRepoFiles(repo, token);
    if (!files.length) return error("That repository has no text files to import.", 400);
    const messages = JSON.parse(row.messages_json || "[]") as ChatMessage[];
    messages.push({
      id: newId("msg"),
      role: "system",
      content: `Imported the files from ${repo}. The preview lists them so you can keep working in Architect.`,
      timestamp: Date.now(),
      meta: "Import",
    });
    await db
      .prepare(
        `UPDATE projects SET
          name = ?, github_connected = 1, github_repo = ?, files_json = ?, preview_html = ?,
          messages_json = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        repo.split("/").pop() || row.name,
        repo,
        JSON.stringify(files),
        previewFromFiles(repo, files),
        JSON.stringify(messages),
        Date.now(),
        id,
      );
    const updated = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(id)) as DbProject;
    return json({ project: toClientProject(updated) });
  } catch (err) {
    return error(err instanceof Error ? err.message : "Import failed", 400);
  }
}

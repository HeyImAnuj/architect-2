import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, type DbProject } from "@/lib/db";
import { error, json } from "@/lib/api";
import { toClientProject } from "@/lib/project-mapper";
import { pushRepository } from "@/lib/github";
import { decryptSecret } from "@/lib/secrets";
import type { CodeFile } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = (await db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(id, user.id)) as DbProject | undefined;
  if (!row) return error("Not found", 404);

  const account = (await db
    .prepare("SELECT github_token, github_login FROM users WHERE id = ?")
    .get(user.id)) as { github_token: string | null; github_login: string | null } | undefined;
  if (!account?.github_token || !account.github_login) {
    return error("Sign in with GitHub before creating a repository.", 401);
  }

  const body = await req.json().catch(() => ({}));
  const requested = String(body.repo || row.name || "architect-app");
  const name = requested.includes("/") ? requested.split("/").pop() || row.name : requested;
  const files = JSON.parse(row.files_json || "[]") as CodeFile[];

  try {
    const pushed = await pushRepository({
      token: decryptSecret(account.github_token),
      login: account.github_login,
      name,
      description: row.description || row.prompt,
      files,
      previewHtml: row.preview_html,
    });
    await db
      .prepare(
        `UPDATE projects SET github_connected = 1, github_repo = ?, updated_at = ? WHERE id = ?`,
      )
      .run(pushed.fullName, Date.now(), id);
    const updated = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(id)) as DbProject;
    return json({
      project: toClientProject(updated),
      repoUrl: pushed.url,
      message: `Created ${pushed.fullName} and pushed the project files.`,
    });
  } catch (err) {
    return error(err instanceof Error ? err.message : "GitHub push failed", 502);
  }
}

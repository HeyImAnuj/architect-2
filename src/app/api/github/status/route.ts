import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error, json } from "@/lib/api";
import { listRepos } from "@/lib/github";
import { decryptSecret } from "@/lib/secrets";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const configured = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  try {
    const row = (await db.prepare("SELECT github_token, github_login FROM users WHERE id = ?").get(user.id)) as
      | { github_token: string | null; github_login: string | null }
      | undefined;
    if (!row?.github_token) return json({ connected: false, configured, login: null, repos: [] });
    const repos = await listRepos(decryptSecret(row.github_token));
    return json({ connected: true, configured, login: row.github_login, repos });
  } catch {
    return json({ connected: false, configured, login: null, repos: [] });
  }
}

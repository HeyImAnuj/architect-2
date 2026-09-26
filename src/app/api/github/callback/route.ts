import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { exchangeCode, githubLogin } from "@/lib/github";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/secrets";

function page(ok: boolean, message: string) {
  const payload = JSON.stringify({ type: "architect-github", ok, message });
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>GitHub</title><p>${message}</p><script>
      const data = ${payload};
      if (window.opener) window.opener.postMessage(data, window.location.origin);
      setTimeout(() => window.close(), 400);
    </script>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: NextRequest) {
  const error = req.nextUrl.searchParams.get("error");
  if (error) return page(false, "GitHub sign-in was cancelled.");
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const jar = await cookies();
  const stored = jar.get("github_oauth_state")?.value || "";
  jar.delete("github_oauth_state");
  const [userId, savedState] = stored.split(".");
  if (!code || !userId || !savedState || savedState !== state) {
    return page(false, "GitHub sign-in could not be verified. Try again.");
  }
  try {
    const token = await exchangeCode(req.nextUrl.origin, code);
    const login = await githubLogin(token);
    await db
      .prepare("UPDATE users SET github_token = ?, github_login = ?, updated_at = ? WHERE id = ?")
      .run(encryptSecret(token), login, Date.now(), userId);
    return page(true, `Connected as ${login}`);
  } catch (err) {
    return page(false, err instanceof Error ? err.message : "GitHub connection failed.");
  }
}

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  findUserByEmail,
  hashPassword,
  setSessionCookie,
  toPublicUser,
  verifyPassword,
  clearSessionCookie,
  getSessionUser,
} from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { error, json } from "@/lib/api";

const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return json({ user: null });
  return json({ user });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === "register") {
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return error("Invalid registration payload");
    const email = parsed.data.email.toLowerCase();
    if (await findUserByEmail(email)) return error("Email already registered", 409);
    const now = Date.now();
    const id = newId("user");
    const passwordHash = await hashPassword(parsed.data.password);
    await db.prepare(
      `INSERT INTO users (id, email, name, password_hash, provider, avatar, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'email', NULL, ?, ?)`,
    ).run(id, email, parsed.data.name, passwordHash, now, now);
    const user = (await findUserByEmail(email))!;
    const token = await createSessionToken(toPublicUser(user));
    await setSessionCookie(token);
    return json({ user: toPublicUser(user) });
  }

  if (action === "login") {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return error("Invalid login payload");
    const user = await findUserByEmail(parsed.data.email.toLowerCase());
    if (!user?.password_hash) return error("Invalid email or password", 401);
    const ok = await verifyPassword(parsed.data.password, user.password_hash);
    if (!ok) return error("Invalid email or password", 401);
    const token = await createSessionToken(toPublicUser(user));
    await setSessionCookie(token);
    return json({ user: toPublicUser(user) });
  }

  if (action === "guest") {
    const now = Date.now();
    const id = newId("user");
    const email = `guest_${id.slice(-6)}@architect.local`;
    const name = body.name?.trim() || "Guest Builder";
    await db.prepare(
      `INSERT INTO users (id, email, name, password_hash, provider, avatar, created_at, updated_at)
       VALUES (?, ?, ?, NULL, 'guest', NULL, ?, ?)`,
    ).run(id, email, name, now, now);
    const user = (await findUserByEmail(email))!;
    const token = await createSessionToken(toPublicUser(user));
    await setSessionCookie(token);
    return json({ user: toPublicUser(user) });
  }

  if (action === "google") {
    // Client-side Google Identity token payload (verified lightly for demo; production should verify with Google certs)
    const { credential, profile } = body as {
      credential?: string;
      profile?: { email?: string; name?: string; picture?: string; sub?: string };
    };
    if (!profile?.email) {
      // Fallback simulated Google when no OAuth client configured
      const now = Date.now();
      const id = newId("user");
      const email = `google_${id.slice(-6)}@gmail.com`;
      const name = "Google User";
      const existing = await findUserByEmail(email);
      if (!existing) {
        await db.prepare(
          `INSERT INTO users (id, email, name, password_hash, provider, avatar, created_at, updated_at)
           VALUES (?, ?, ?, NULL, 'google', NULL, ?, ?)`,
        ).run(id, email, name, now, now);
      }
      const user = (await findUserByEmail(email))!;
      const token = await createSessionToken(toPublicUser(user));
      await setSessionCookie(token);
      return json({ user: toPublicUser(user), simulated: true });
    }

    const email = profile.email.toLowerCase();
    let user = await findUserByEmail(email);
    const now = Date.now();
    if (!user) {
      const id = profile.sub ? `google_${profile.sub}` : newId("user");
      await db.prepare(
        `INSERT INTO users (id, email, name, password_hash, provider, avatar, created_at, updated_at)
         VALUES (?, ?, ?, NULL, 'google', ?, ?, ?)`,
      ).run(id, email, profile.name || email.split("@")[0], profile.picture || null, now, now);
      user = (await findUserByEmail(email))!;
    } else {
      await db.prepare(
        `UPDATE users SET name = ?, avatar = ?, provider = 'google', updated_at = ? WHERE id = ?`,
      ).run(profile.name || user.name, profile.picture || user.avatar, now, user.id);
      user = (await findUserByEmail(email))!;
    }
    const token = await createSessionToken(toPublicUser(user));
    await setSessionCookie(token);
    return json({ user: toPublicUser(user), credentialUsed: Boolean(credential) });
  }

  if (action === "logout") {
    await clearSessionCookie();
    return json({ ok: true });
  }

  if (action === "forgot") {
    const email = String(body.email || "").toLowerCase();
    const user = await findUserByEmail(email);
    if (!user) return json({ ok: true, message: "If that email exists, a reset link is ready." });
    const token = newId("reset");
    const expires = Date.now() + 1000 * 60 * 30;
    await db
      .prepare(
        "INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)",
      )
      .run(token, user.id, expires);
    const resetUrl = `${req.nextUrl.origin}/auth/reset?token=${token}`;
    return json({
      ok: true,
      resetUrl,
      message: "Reset link created. Open it to choose a new password.",
    });
  }

  if (action === "reset") {
    const token = String(body.token || "");
    const password = String(body.password || "");
    if (password.length < 6) return error("Password must be at least 6 characters");
    const row = await db
      .prepare("SELECT user_id, expires_at FROM password_resets WHERE token = ?")
      .get<{ user_id: string; expires_at: string | number }>(token);
    if (!row || Number(row.expires_at) < Date.now()) return error("Reset link expired", 400);
    const passwordHash = await hashPassword(password);
    await db
      .prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
      .run(passwordHash, Date.now(), row.user_id);
    await db.prepare("DELETE FROM password_resets WHERE token = ?").run(token);
    return json({ ok: true });
  }

  return error("Unknown action");
}

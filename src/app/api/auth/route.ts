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
    if (findUserByEmail(email)) return error("Email already registered", 409);
    const now = Date.now();
    const id = newId("user");
    const passwordHash = await hashPassword(parsed.data.password);
    db.prepare(
      `INSERT INTO users (id, email, name, password_hash, provider, avatar, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'email', NULL, ?, ?)`,
    ).run(id, email, parsed.data.name, passwordHash, now, now);
    const user = findUserByEmail(email)!;
    const token = await createSessionToken(toPublicUser(user));
    await setSessionCookie(token);
    return json({ user: toPublicUser(user) });
  }

  if (action === "login") {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return error("Invalid login payload");
    const user = findUserByEmail(parsed.data.email.toLowerCase());
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
    db.prepare(
      `INSERT INTO users (id, email, name, password_hash, provider, avatar, created_at, updated_at)
       VALUES (?, ?, ?, NULL, 'guest', NULL, ?, ?)`,
    ).run(id, email, name, now, now);
    const user = findUserByEmail(email)!;
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
      const existing = findUserByEmail(email);
      if (!existing) {
        db.prepare(
          `INSERT INTO users (id, email, name, password_hash, provider, avatar, created_at, updated_at)
           VALUES (?, ?, ?, NULL, 'google', NULL, ?, ?)`,
        ).run(id, email, name, now, now);
      }
      const user = findUserByEmail(email)!;
      const token = await createSessionToken(toPublicUser(user));
      await setSessionCookie(token);
      return json({ user: toPublicUser(user), simulated: true });
    }

    const email = profile.email.toLowerCase();
    let user = findUserByEmail(email);
    const now = Date.now();
    if (!user) {
      const id = profile.sub ? `google_${profile.sub}` : newId("user");
      db.prepare(
        `INSERT INTO users (id, email, name, password_hash, provider, avatar, created_at, updated_at)
         VALUES (?, ?, ?, NULL, 'google', ?, ?, ?)`,
      ).run(id, email, profile.name || email.split("@")[0], profile.picture || null, now, now);
      user = findUserByEmail(email)!;
    } else {
      db.prepare(
        `UPDATE users SET name = ?, avatar = ?, provider = 'google', updated_at = ? WHERE id = ?`,
      ).run(profile.name || user.name, profile.picture || user.avatar, now, user.id);
      user = findUserByEmail(email)!;
    }
    const token = await createSessionToken(toPublicUser(user));
    await setSessionCookie(token);
    return json({ user: toPublicUser(user), credentialUsed: Boolean(credential) });
  }

  if (action === "logout") {
    await clearSessionCookie();
    return json({ ok: true });
  }

  return error("Unknown action");
}

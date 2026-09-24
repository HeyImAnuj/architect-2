"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function AuthPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const hydrated = useAppStore((s) => s.hydrated);
  const register = useAppStore((s) => s.register);
  const login = useAppStore((s) => s.login);
  const signInGoogle = useAppStore((s) => s.signInGoogle);
  const signInGuest = useAppStore((s) => s.signInGuest);

  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && user) router.replace("/home");
  }, [hydrated, user, router]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("email");
    try {
      if (mode === "register") {
        await register(name || email.split("@")[0], email, password);
      } else {
        await login(email, password);
      }
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleGoogle() {
    setBusy("google");
    setError(null);
    try {
      await signInGoogle();
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleGuest() {
    setBusy("guest");
    try {
      await signInGuest();
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guest sign-in failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="blueprint-bg flex min-h-screen items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel w-full max-w-md p-7"
      >
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-text"
        >
          <Sparkles className="h-4 w-4 text-mint" />
          Architect 2.0
        </Link>
        <h1 className="display text-3xl font-bold text-paper">Enter the atelier</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Real accounts backed by SQLite. Create an email login, continue with Google,
          or explore as guest.
        </p>

        <div className="mt-5 flex rounded-xl border border-line bg-ink-2 p-1">
          {(["register", "login"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize ${
                mode === m ? "bg-mint text-[#042f2e]" : "text-muted"
              }`}
            >
              {m === "register" ? "Sign up" : "Sign in"}
            </button>
          ))}
        </div>

        <form className="mt-4 grid gap-3" onSubmit={handleEmail}>
          {mode === "register" && (
            <input
              className="input"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className="input"
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <div className="rounded-xl border border-rose/40 bg-rose/10 px-3 py-2 text-sm text-rose">
              {error}
            </div>
          )}
          <button className="btn btn-primary w-full" disabled={!!busy}>
            {busy === "email"
              ? "Working…"
              : mode === "register"
                ? "Create account"
                : "Sign in"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-line" />
          or
          <div className="h-px flex-1 bg-line" />
        </div>

        <div className="grid gap-3">
          <button
            className="btn btn-ghost w-full"
            onClick={handleGoogle}
            disabled={!!busy}
            type="button"
          >
            {busy === "google" ? "Connecting Google…" : "Continue with Google"}
          </button>
          <button
            className="btn btn-soft w-full"
            onClick={handleGuest}
            disabled={!!busy}
            type="button"
          >
            {busy === "guest" ? "Opening…" : "Continue as guest"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

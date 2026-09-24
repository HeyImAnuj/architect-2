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
  const signInGoogle = useAppStore((s) => s.signInGoogle);
  const signInGuest = useAppStore((s) => s.signInGuest);
  const [busy, setBusy] = useState<"google" | "guest" | null>(null);

  useEffect(() => {
    if (hydrated && user) router.replace("/home");
  }, [hydrated, user, router]);

  async function handleGoogle() {
    setBusy("google");
    await new Promise((r) => setTimeout(r, 700));
    signInGoogle();
    router.push("/home");
  }

  async function handleGuest() {
    setBusy("guest");
    await new Promise((r) => setTimeout(r, 400));
    signInGuest();
    router.push("/home");
  }

  return (
    <div className="blueprint-bg flex min-h-screen items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel w-full max-w-md p-7"
      >
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-text">
          <Sparkles className="h-4 w-4 text-mint" />
          Architect 2.0
        </Link>
        <h1 className="display text-3xl font-bold text-paper">Enter the atelier</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Authentication is wired as a real product flow. Google sign-in is simulated
          for this assignment demo; guest mode lets reviewers explore immediately.
        </p>

        <div className="mt-7 grid gap-3">
          <button
            className="btn btn-primary w-full"
            onClick={handleGoogle}
            disabled={!!busy}
          >
            {busy === "google" ? "Connecting Google…" : "Continue with Google"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            className="btn btn-ghost w-full"
            onClick={handleGuest}
            disabled={!!busy}
          >
            {busy === "guest" ? "Opening…" : "Continue as guest"}
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-line bg-ink-2 p-3 text-xs leading-relaxed text-muted">
          <strong className="text-paper">Why both lanes start here:</strong> Soft users
          need zero friction. Pro users need identity for GitHub, deploy, and team
          workspaces. Same gate, different depth later.
        </div>
      </motion.div>
    </div>
  );
}

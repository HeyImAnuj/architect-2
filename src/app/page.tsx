"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GitBranch,
  Layers3,
  Rocket,
  Sparkles,
  SquareCode,
  Users,
} from "lucide-react";
import { useAppStore } from "@/lib/store";

const pillars = [
  {
    icon: Users,
    title: "Soft lane",
    text: "Operators prompt outcomes, shape agents visually, and ship without touching source.",
  },
  {
    icon: SquareCode,
    title: "Pro lane",
    text: "Engineers get files, diffs, frameworks, terminals, and GitHub — same project, deeper control.",
  },
  {
    icon: Layers3,
    title: "Agent graph as truth",
    text: "The orchestration map is the source of truth. UI and code stay synchronized to it.",
  },
];

const contrasts = [
  {
    them: "Lovable / Bolt",
    us: "Great for CRUD SaaS. Architect 2.0 is agent-native: multi-agent graphs, tools, knowledge, traces.",
  },
  {
    them: "Cursor / Codex",
    us: "Best for engineers in an IDE. We keep a Soft lane so PMs and ops can build beside them.",
  },
  {
    them: "Today's Architect",
    us: "Brilliant for non-technical builders. 2.0 adds Pro depth: frameworks, import, GitHub, code ownership.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const hydrated = useAppStore((s) => s.hydrated);

  return (
    <div className="blueprint-bg min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-panel-2">
            <Sparkles className="h-4 w-4 text-mint" />
          </div>
          <div>
            <div className="display text-lg font-bold leading-none">Architect</div>
            <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted">
              2.0 dual-lane
            </div>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <a href="#difference" className="hover:text-text">
            Difference
          </a>
          <a href="#flow" className="hover:text-text">
            Flow
          </a>
          <a href="#audience" className="hover:text-text">
            Who it&apos;s for
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {hydrated && user ? (
            <Link href="/home" className="btn btn-primary">
              Open studio <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/auth" className="btn btn-ghost hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/auth" className="btn btn-primary">
                Start building
              </Link>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pt-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="chip chip-mint mb-5"
            >
              Not another chat-left / preview-right clone
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="display max-w-xl text-5xl font-extrabold leading-[0.98] text-paper sm:text-6xl"
            >
              Architect
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-5 max-w-xl text-lg leading-relaxed text-muted"
            >
              Dual-lane vibe coding for agentic apps. Prompt an entire multi-agent
              product — then peel open source when engineers need control.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <button
                className="btn btn-primary"
                onClick={() => router.push(user ? "/home" : "/auth")}
              >
                Build an agentic app <ArrowRight className="h-4 w-4" />
              </button>
              <a href="#flow" className="btn btn-ghost">
                See the flow
              </a>
            </motion.div>
            <div className="mt-8 flex flex-wrap gap-2 text-xs text-muted">
              <span className="chip">Prompt → agents → UI → deploy</span>
              <span className="chip">Import GitHub</span>
              <span className="chip">Any agent framework</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="panel relative overflow-hidden p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="mono text-xs text-muted">atelier://workspace</span>
              <span className="chip chip-mint">Soft ↔ Pro</span>
            </div>
            <div className="grid gap-3">
              <div className="rounded-xl border border-line bg-ink-2 p-3">
                <div className="mb-2 text-xs text-muted">Build map</div>
                <div className="flex items-center gap-1">
                  {["Intent", "Plan", "Agents", "UI", "QA", "Ship"].map((step, i) => (
                    <div key={step} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className={`h-1.5 w-full rounded-full ${
                          i < 5 ? "bg-mint" : "bg-line"
                        }`}
                      />
                      <span className="mono text-[9px] text-muted">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-line bg-ink-2 p-3">
                  <div className="text-xs text-mint">Soft</div>
                  <p className="mt-1 text-sm leading-snug text-paper">
                    Chat the outcome. Edit the agent graph. Watch UI assemble.
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-ink-2 p-3">
                  <div className="text-xs text-cyan">Pro</div>
                  <p className="mt-1 text-sm leading-snug text-paper">
                    Files, frameworks, GitHub sync, deploy configs, traces.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-line bg-[linear-gradient(135deg,rgba(45,212,191,.08),transparent)] p-4">
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch className="h-4 w-4 text-cyan" />
                  Connected · main ← architect/patch-ui
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                  <Rocket className="h-4 w-4 text-amber" />
                  Preview live · ready to promote
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="audience" className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="display text-3xl font-bold text-paper">One atelier, two audiences</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Current Architect wins non-technical builders. Architect 2.0 keeps that
            path — and adds a Pro lane so engineers never hit a ceiling.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pillars.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="panel p-5"
              >
                <item.icon className="h-5 w-5 text-mint" />
                <h3 className="mt-3 text-lg font-semibold text-paper">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="difference" className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="display text-3xl font-bold text-paper">Why this gets selected</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Designed from the user job — not cloned from a competitor layout.
          </p>
          <div className="mt-8 grid gap-3">
            {contrasts.map((row) => (
              <div
                key={row.them}
                className="grid gap-3 rounded-2xl border border-line bg-panel/80 p-4 md:grid-cols-[180px_1fr]"
              >
                <div className="mono text-xs uppercase tracking-wider text-muted">
                  vs {row.them}
                </div>
                <div className="text-sm leading-relaxed text-paper">{row.us}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="flow" className="mx-auto max-w-6xl px-6 py-14 pb-24">
          <h2 className="display text-3xl font-bold text-paper">End-to-end flow</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {[
              ["01 Auth", "Google or guest — enter the atelier"],
              ["02 Compose", "Prompt, import GitHub, or start blank"],
              ["03 Build", "Soft chat + agent graph + live UI, or Pro source"],
              ["04 Ship", "Connect repo, deploy URL, observe traces"],
            ].map(([title, body]) => (
              <div key={title} className="panel p-5">
                <div className="mono text-xs text-mint">{title}</div>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/auth" className="btn btn-primary">
              Enter Architect 2.0 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

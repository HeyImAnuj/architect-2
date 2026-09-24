"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  FolderGit2,
  GitBranch,
  LogOut,
  Plus,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { FRAMEWORKS, formatRelative } from "@/lib/utils";
import type { AudienceMode, FrameworkId } from "@/lib/types";
import { PROMPT_STARTERS } from "@/lib/mock";

type ComposeTab = "prompt" | "github" | "zip" | "blank";

export default function HomePage() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const user = useAppStore((s) => s.user);
  const projects = useAppStore((s) => s.projects);
  const createProject = useAppStore((s) => s.createProject);
  const signOut = useAppStore((s) => s.signOut);
  const ensureDemo = useAppStore((s) => s.ensureDemo);

  const [tab, setTab] = useState<ComposeTab>("prompt");
  const [prompt, setPrompt] = useState("");
  const [framework, setFramework] = useState<FrameworkId>("lyzr");
  const [mode, setMode] = useState<AudienceMode>("soft");
  const [githubRepo, setGithubRepo] = useState("acme/support-agents");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (hydrated && !user) router.replace("/auth");
    if (hydrated && user) ensureDemo();
  }, [hydrated, user, router, ensureDemo]);

  const frameworks = useMemo(
    () =>
      FRAMEWORKS.filter((f) => mode === "pro" || f.audience === "both"),
    [mode],
  );

  async function handleCreate() {
    setCreating(true);
    const source =
      tab === "github"
        ? "import-github"
        : tab === "zip"
          ? "import-zip"
          : tab === "blank"
            ? "blank"
            : "prompt";
    const id = createProject({
      prompt:
        tab === "prompt"
          ? prompt || PROMPT_STARTERS[0].prompt
          : tab === "github"
            ? `Continue building imported repo ${githubRepo}`
            : tab === "zip"
              ? "Imported local project — map agents and keep iterating"
              : "Blank agentic canvas",
      framework,
      mode,
      source,
      githubRepo: tab === "github" ? githubRepo : undefined,
    });
    await new Promise((r) => setTimeout(r, 350));
    router.push(`/workspace/${id}`);
  }

  if (!hydrated || !user) {
    return <div className="blueprint-bg min-h-screen" />;
  }

  return (
    <div className="blueprint-bg min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-panel-2">
            <Sparkles className="h-4 w-4 text-mint" />
          </div>
          <div>
            <div className="display text-lg font-bold leading-none">Architect</div>
            <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted">
              studio home
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold text-paper">{user.name}</div>
            <div className="text-xs text-muted">{user.email}</div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => {
              signOut();
              router.push("/");
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="display text-3xl font-bold text-paper">Compose</h1>
              <p className="mt-1 text-sm text-muted">
                Start from intent, import an existing project, or open a blank canvas.
              </p>
            </div>
            <div className="flex rounded-xl border border-line bg-ink-2 p-1">
              {(
                [
                  ["soft", "Soft"],
                  ["pro", "Pro"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    mode === id
                      ? "bg-mint text-[#042f2e]"
                      : "text-muted hover:text-text"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(
              [
                ["prompt", "Prompt", Zap],
                ["github", "Import GitHub", GitBranch],
                ["zip", "Import zip", Upload],
                ["blank", "Blank", Plus],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  tab === id
                    ? "border-mint/40 bg-mint/10 text-mint"
                    : "border-line bg-ink-2 text-muted hover:text-text"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-5"
            >
              {tab === "prompt" && (
                <div className="grid gap-3">
                  <textarea
                    className="textarea min-h-[140px]"
                    placeholder="Describe the agentic app you want…"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PROMPT_STARTERS.map((starter) => (
                      <button
                        key={starter.title}
                        onClick={() => setPrompt(starter.prompt)}
                        className="rounded-xl border border-line bg-ink-2 p-3 text-left hover:border-cyan/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-paper">
                            {starter.title}
                          </span>
                          <span className="chip">{starter.tag}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted">
                          {starter.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab === "github" && (
                <div className="grid gap-3">
                  <label className="text-sm text-muted">Repository</label>
                  <input
                    className="input mono"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="org/repo"
                  />
                  <p className="text-sm text-muted">
                    Dummy OAuth flow: we&apos;ll map the repo into Architect, keep
                    working in Soft/Pro, and sync branches later from the workspace.
                  </p>
                </div>
              )}

              {tab === "zip" && (
                <div className="rounded-2xl border border-dashed border-line bg-ink-2 p-8 text-center">
                  <Upload className="mx-auto h-8 w-8 text-cyan" />
                  <p className="mt-3 text-sm text-paper">Drop a project zip</p>
                  <p className="mt-1 text-xs text-muted">
                    Demo accepts any click — we simulate parsing structure + agents.
                  </p>
                  <button className="btn btn-soft mt-4" onClick={handleCreate}>
                    Simulate import
                  </button>
                </div>
              )}

              {tab === "blank" && (
                <div className="rounded-2xl border border-line bg-ink-2 p-6">
                  <FolderGit2 className="h-6 w-6 text-mint" />
                  <h3 className="mt-3 font-semibold text-paper">Blank agentic canvas</h3>
                  <p className="mt-1 text-sm text-muted">
                    For technical users who want to scaffold first, or Soft users who
                    want to explore the atelier before committing an idea.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-5">
            <div className="mb-2 text-sm font-semibold text-paper">Agent framework</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {frameworks.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFramework(f.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    framework === f.id
                      ? "border-mint/50 bg-mint/10"
                      : "border-line bg-ink-2 hover:border-cyan/30"
                  }`}
                >
                  <div className="text-sm font-semibold text-paper">{f.label}</div>
                  <div className="mt-1 text-xs text-muted">{f.blurb}</div>
                </button>
              ))}
            </div>
            {mode === "soft" && (
              <p className="mt-2 text-xs text-muted">
                Soft mode shows approachable frameworks. Switch to Pro for LangGraph,
                AutoGen, OpenAI Agents, and BYO.
              </p>
            )}
          </div>

          {tab !== "zip" && (
            <button
              className="btn btn-primary mt-6"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? "Opening atelier…" : "Create project"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </section>

        <section className="grid gap-4 self-start">
          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-paper">Your projects</h2>
              <span className="chip">{projects.length}</span>
            </div>
            <div className="mt-4 grid gap-2">
              {projects.length === 0 && (
                <p className="text-sm text-muted">No projects yet — compose one.</p>
              )}
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/workspace/${p.id}`}
                  className="rounded-xl border border-line bg-ink-2 p-3 transition hover:border-cyan/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-paper">{p.name}</div>
                      <div className="mt-1 line-clamp-2 text-xs text-muted">
                        {p.description}
                      </div>
                    </div>
                    <span className="chip chip-mint capitalize">{p.mode}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted">
                    <span className="chip">{p.framework}</span>
                    <span className="chip">{p.phase}</span>
                    {p.githubConnected && <span className="chip">GitHub</span>}
                    {p.deployed && <span className="chip">Deployed</span>}
                    <span className="ml-auto">{formatRelative(p.updatedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <h3 className="font-semibold text-paper">Product thinking</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>Non-tech starts on Soft with curated frameworks.</li>
              <li>Tech starts on Pro with import + BYO frameworks.</li>
              <li>Same project ID — they can switch lanes anytime.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

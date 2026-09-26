"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Mic,
  Paperclip,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import type { AudienceMode, FrameworkId, Project } from "@/lib/types";
import { FRAMEWORKS, formatRelative } from "@/lib/utils";
import { PROMPT_STARTERS } from "@/lib/mock";
import {
  CONNECTORS,
  DESIGN_SYSTEMS,
  DISCORD_URL,
  DOC_PAGES,
  HELP_ITEMS,
  HOW_STEPS,
  IDEA_PROMPTS,
  LESSONS,
  MARKETPLACE,
  PROMPT_LIBRARY,
  STUDIO_AGENTS,
  type StudioScreen,
} from "@/lib/studio-catalog";

const titles: Record<StudioScreen, { title: string; body: string }> = {
  prompt: {
    title: "Agent Studio",
    body: "Describe the agentic app. Attach context, connect tools, and Architect will plan it before building.",
  },
  github: {
    title: "Import GitHub",
    body: "Start from a repository. The project stays editable in Soft or Pro.",
  },
  zip: {
    title: "Import zip",
    body: "Bring a local project in. Architect maps the structure and opens the studio.",
  },
  blank: {
    title: "Blank canvas",
    body: "Open an empty project and shape the agents before you commit to an idea.",
  },
  mine: {
    title: "My projects",
    body: "Everything you have started. Open one to keep planning, or share it with the team.",
  },
  published: {
    title: "Published projects",
    body: "Apps that already have a public preview link.",
  },
  shared: {
    title: "Shared projects",
    body: "Projects you marked as shared. Teammates can find them from this list.",
  },
  usage: {
    title: "Usage",
    body: "What this account has built, published, and spent.",
  },
  how: {
    title: "How it works",
    body: "From a sentence to a plan, an agent graph, a preview, and a link.",
  },
  library: {
    title: "Prompt library",
    body: "Start from a prompt that already names the outcome, then edit it in Agent Studio.",
  },
  marketplace: {
    title: "Marketplace",
    body: "Apps you can open in the studio and make your own.",
  },
  ideas: {
    title: "What should I build",
    body: "Pick a starting point if the blank page is the hard part.",
  },
  docs: {
    title: "Docs",
    body: "How planning, agents, knowledge, and publishing fit together.",
  },
  design: {
    title: "Design systems",
    body: "The next build uses the system you select. It changes type, density, and tone.",
  },
  discord: {
    title: "Discord",
    body: "The Lyzr community is where people ask questions and show what they shipped.",
  },
  university: {
    title: "Lyzr University",
    body: "Short lessons for getting a useful agentic app out of a prompt.",
  },
  help: {
    title: "Help and support",
    body: "Answers for the studio. For live chat, the Discord community is the next stop.",
  },
  account: {
    title: "My account",
    body: "The person signed in, and the studio credits on this account.",
  },
};

export function StudioPanels({
  screen,
  prompt,
  setPrompt,
  mode,
  framework,
  githubRepo,
  setGithubRepo,
  zipName,
  onZip,
  creating,
  error,
  onCreate,
  projects,
  onShare,
  designId,
  setDesignId,
  connectors,
  toggleConnector,
  agentIds,
  toggleAgent,
  attachmentName,
  onAttach,
  listening,
  onVoice,
  onUsePrompt,
  credits,
  onGrantCredits,
  userName,
  userEmail,
}: {
  screen: StudioScreen;
  prompt: string;
  setPrompt: (value: string) => void;
  mode: AudienceMode;
  framework: FrameworkId;
  githubRepo: string;
  setGithubRepo: (value: string) => void;
  zipName?: string;
  onZip?: (file: File) => void;
  creating: boolean;
  error: string | null;
  onCreate: () => void;
  projects: Project[];
  onShare: (project: Project) => void;
  designId: string;
  setDesignId: (id: string) => void;
  connectors: string[];
  toggleConnector: (name: string) => void;
  agentIds: string[];
  toggleAgent: (id: string) => void;
  attachmentName: string;
  onAttach: (file: File) => void;
  listening: boolean;
  onVoice: () => void;
  onUsePrompt: (prompt: string) => void;
  credits: number;
  onGrantCredits: () => void;
  userName: string;
  userEmail: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [plusOpen, setPlusOpen] = useState(false);
  const [lesson, setLesson] = useState(0);
  const copy = titles[screen];
  const design = DESIGN_SYSTEMS.find((item) => item.id === designId) ?? DESIGN_SYSTEMS[0];
  const frameworkLabel = FRAMEWORKS.find((item) => item.id === framework)?.label ?? framework;

  const listed =
    screen === "published"
      ? projects.filter((project) => project.deployed)
      : screen === "shared"
        ? projects.filter((project) => project.visibility === "shared")
        : projects;

  const centered = screen === "prompt";

  return (
    <div className={centered ? "mx-auto w-full max-w-[640px] pt-14 text-center" : "mx-auto w-full max-w-3xl"}>
      {centered ? (
        <>
          <Sparkles className="mx-auto h-7 w-7 text-[#5b6472]" />
          <h2 className="display mt-3 text-[3.25rem] text-paper">Architect</h2>
          <p className="mx-auto mt-2 text-sm text-muted">
            Describe an agentic app. Architect plans it with you.
          </p>
        </>
      ) : (
        <>
          <h2 className="display text-[2.4rem] text-paper">{copy.title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{copy.body}</p>
        </>
      )}

      <div className={centered ? "mt-8 text-left" : "mt-8"}>
        {screen === "prompt" && (
          <div className="grid gap-6">
            <div className="rounded-[20px] border border-[#e7e9ee] bg-white p-3 shadow-[0_8px_30px_rgba(17,24,39,0.05)]">
              <textarea
                className="textarea min-h-[72px] border-0 bg-transparent px-2 py-1 shadow-none"
                placeholder="Describe the agentic app you want…"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="relative">
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#5b6472] hover:bg-[#f3f4f6]"
                    onClick={() => setPlusOpen((open) => !open)}
                    aria-expanded={plusOpen}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  {plusOpen && (
                    <div className="absolute left-0 z-20 mt-2 w-72 rounded-xl border border-line bg-white p-3 shadow-[var(--shadow)]">
                      <button
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold hover:bg-panel-2"
                        onClick={() => fileRef.current?.click()}
                      >
                        <Paperclip className="h-4 w-4 text-mint" />
                        Attach a file
                      </button>
                      <p className="px-2 pb-2 text-[11px] text-muted">
                        Text, markdown, CSV, or JSON. Architect keeps it as context for the plan.
                      </p>
                      <div className="border-t border-line pt-2">
                        <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                          Studio agents
                        </div>
                        {STUDIO_AGENTS.map((agent) => (
                          <button
                            key={agent.id}
                            className={`mt-1 w-full rounded-lg px-2 py-2 text-left ${
                              agentIds.includes(agent.id) ? "bg-mint/10" : "hover:bg-panel-2"
                            }`}
                            onClick={() => toggleAgent(agent.id)}
                          >
                            <div className="text-sm font-semibold text-paper">{agent.name}</div>
                            <div className="text-[11px] text-muted">{agent.note}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md,.csv,.json,text/plain"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) onAttach(file);
                      setPlusOpen(false);
                    }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${listening ? "bg-mint/10 text-mint" : "text-[#5b6472] hover:bg-[#f3f4f6]"}`}
                    onClick={onVoice}
                    aria-label="Dictate"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-white disabled:opacity-60"
                    onClick={onCreate}
                    disabled={creating}
                    aria-label="Build"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {attachmentName && (
                <p className="mt-2 text-xs text-muted">Attached · {attachmentName}</p>
              )}
            </div>

            <div className="text-center">
              <div className="text-xs text-muted">Connect with</div>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {CONNECTORS.map((name) => (
                  <button
                    key={name}
                    onClick={() => toggleConnector(name)}
                    className={`chip ${connectors.includes(name) ? "chip-mint" : ""}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">
                {mode === "soft" ? "Soft" : "Pro"} · {frameworkLabel} · {design.name}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {PROMPT_STARTERS.map((starter) => (
                <button
                  key={starter.title}
                  onClick={() => setPrompt(starter.prompt)}
                  className="rounded-xl border border-line bg-white p-4 text-left hover:border-mint/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-paper">{starter.title}</span>
                    <span className="chip">{starter.tag}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{starter.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === "github" && (
          <div className="grid max-w-xl gap-3">
            <label className="text-sm font-semibold text-paper" htmlFor="repo">
              Repository
            </label>
            <input
              id="repo"
              className="input mono bg-white"
              value={githubRepo}
              onChange={(event) => setGithubRepo(event.target.value)}
              placeholder="org/repo"
            />
            <p className="text-sm text-muted">
              Public repositories can be imported by name. Private ones need GitHub sign-in from the workspace.
            </p>
          </div>
        )}

        {screen === "zip" && (
          <div className="max-w-xl rounded-2xl border border-dashed border-line bg-white p-8 text-center">
            <Upload className="mx-auto h-8 w-8 text-mint" />
            <p className="mt-3 text-sm font-semibold text-paper">Project zip</p>
            <p className="mt-1 text-sm text-muted">
              {zipName ? zipName : "Choose the zip of an existing project. Architect opens those files in the studio."}
            </p>
            <label className="btn btn-soft mt-4">
              Choose zip
              <input
                className="hidden"
                type="file"
                accept=".zip,application/zip"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onZip?.(file);
                }}
              />
            </label>
          </div>
        )}

        {screen === "blank" && (
          <div className="max-w-xl rounded-2xl border border-line bg-white p-6">
            <Plus className="h-6 w-6 text-mint" />
            <h3 className="mt-3 font-semibold text-paper">Empty studio</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              No prompt yet. You can add agents, files, and a plan once the canvas opens.
            </p>
          </div>
        )}

        {(screen === "mine" || screen === "published" || screen === "shared") && (
          <ProjectList
            projects={listed}
            empty={
              screen === "published"
                ? "Nothing published yet. Deploy from a project workspace."
                : screen === "shared"
                  ? "Nothing shared yet. Share a project from My projects."
                  : "No projects yet. Start one in Agent Studio."
            }
            onShare={screen === "mine" ? onShare : undefined}
          />
        )}

        {screen === "usage" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Projects", projects.length],
              ["Published", projects.filter((project) => project.deployed).length],
              ["Shared", projects.filter((project) => project.visibility === "shared").length],
              ["Trace events", projects.reduce((sum, project) => sum + (project.traces?.length || 0), 0)],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-line bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
                <div className="display mt-2 text-4xl text-paper">{value}</div>
              </div>
            ))}
            <div className="rounded-xl border border-line bg-white p-4 sm:col-span-2">
              <div className="text-sm font-semibold text-paper">Credits left</div>
              <p className="mt-1 text-sm text-muted">
                {credits} remaining. Each new project uses 12.
              </p>
            </div>
          </div>
        )}

        {screen === "how" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HOW_STEPS.map(([title, body], index) => (
              <div key={title} className="rounded-xl border border-line bg-white p-4">
                <div className="mono text-xs text-mint">0{index + 1}</div>
                <h3 className="mt-2 font-semibold text-paper">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        )}

        {screen === "library" && (
          <div className="grid gap-6">
            {PROMPT_LIBRARY.map((group) => (
              <div key={group.group}>
                <h3 className="text-sm font-semibold text-paper">{group.group}</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <button
                      key={item.title}
                      onClick={() => onUsePrompt(item.prompt)}
                      className="rounded-xl border border-line bg-white p-4 text-left hover:border-mint/40"
                    >
                      <div className="text-sm font-semibold text-paper">{item.title}</div>
                      <p className="mt-2 text-xs leading-relaxed text-muted">{item.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {screen === "marketplace" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {MARKETPLACE.map((app) => (
              <div key={app.id} className="rounded-xl border border-line bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="chip">{app.category}</span>
                  <span className="chip">{app.use}</span>
                </div>
                <h3 className="mt-3 font-semibold text-paper">{app.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{app.summary}</p>
                <button className="btn btn-primary mt-4" onClick={() => onUsePrompt(app.prompt)}>
                  Use in studio
                </button>
              </div>
            ))}
          </div>
        )}

        {screen === "ideas" && (
          <div className="grid gap-3">
            {IDEA_PROMPTS.map((idea) => (
              <button
                key={idea.role}
                onClick={() => onUsePrompt(idea.text)}
                className="rounded-xl border border-line bg-white p-4 text-left hover:border-mint/40"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-mint">{idea.role}</div>
                <p className="mt-2 text-sm leading-relaxed text-paper">{idea.text}</p>
              </button>
            ))}
          </div>
        )}

        {screen === "docs" && (
          <div className="grid max-w-3xl gap-3">
            {DOC_PAGES.map((page) => (
              <div key={page.title} className="rounded-xl border border-line bg-white p-4">
                <h3 className="font-semibold text-paper">{page.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{page.body}</p>
              </div>
            ))}
          </div>
        )}

        {screen === "design" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {DESIGN_SYSTEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setDesignId(item.id)}
                className={`rounded-xl border p-4 text-left ${
                  designId === item.id ? "border-mint bg-mint/10" : "border-line bg-white hover:border-mint/40"
                }`}
              >
                <div className="font-semibold text-paper">{item.name}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.note}</p>
              </button>
            ))}
          </div>
        )}

        {screen === "discord" && (
          <div className="max-w-xl rounded-xl border border-line bg-white p-5">
            <p className="text-sm leading-relaxed text-muted">
              Ask in #help, show a build in #show-and-tell, and read #announcements for what shipped.
            </p>
            <a className="btn btn-primary mt-4" href={DISCORD_URL} target="_blank" rel="noreferrer">
              Open Lyzr Discord
            </a>
          </div>
        )}

        {screen === "university" && (
          <div className="grid max-w-3xl gap-3">
            {LESSONS.map((item, index) => (
              <button
                key={item.title}
                onClick={() => setLesson(index)}
                className={`rounded-xl border p-4 text-left ${
                  lesson === index ? "border-mint bg-white" : "border-line bg-white hover:border-mint/40"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-paper">
                  <GraduationCap className="h-4 w-4 text-mint" />
                  {item.title}
                </div>
                {lesson === index && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {screen === "help" && (
          <div className="grid max-w-3xl gap-3">
            {HELP_ITEMS.map((item) => (
              <div key={item.q} className="rounded-xl border border-line bg-white p-4">
                <h3 className="font-semibold text-paper">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        )}

        {screen === "account" && (
          <div className="max-w-xl rounded-xl border border-line bg-white p-5">
            <div className="text-lg font-semibold text-paper">{userName}</div>
            <div className="mt-1 text-sm text-muted">{userEmail}</div>
            <div className="mt-4 text-sm text-paper">{credits} studio credits</div>
            <button className="btn btn-ghost mt-4" onClick={onGrantCredits}>
              Add 10 credits
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-rose/40 bg-rose/10 px-3 py-2 text-sm text-rose">
          {error}
        </div>
      )}

      {screen !== "prompt" &&
        (screen === "github" || screen === "zip" || screen === "blank" || screen === "design") && (
          <button className="btn btn-primary mt-6" onClick={onCreate} disabled={creating}>
            {creating ? "Building project…" : screen === "design" ? "Create with this system" : "Create project"}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
    </div>
  );
}

function ProjectList({
  projects,
  empty,
  onShare,
}: {
  projects: Project[];
  empty: string;
  onShare?: (project: Project) => void;
}) {
  if (projects.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }
  return (
    <div className="grid gap-3">
      {projects.map((project) => (
        <div key={project.id} className="rounded-xl border border-line bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Link
              href={`/workspace/${project.id}`}
              transitionTypes={["nav-forward"]}
              className="min-w-0"
            >
              <div className="font-semibold text-paper">{project.name}</div>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{project.description}</p>
            </Link>
            <span className="chip chip-mint capitalize">{project.mode}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span className="chip">{project.framework}</span>
            <span className="chip">{project.phase}</span>
            {project.deployed && <span className="chip">Published</span>}
            {project.visibility === "shared" && <span className="chip">Shared</span>}
            <span className="ml-auto">{formatRelative(project.updatedAt)}</span>
            {onShare && (
              <button className="chip" onClick={() => onShare(project)}>
                {project.visibility === "shared" ? "Unshare" : "Share"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

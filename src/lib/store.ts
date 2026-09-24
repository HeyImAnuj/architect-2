"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AudienceMode,
  CreateProjectInput,
  Project,
  User,
  WorkspacePanel,
} from "./types";
import {
  previewMarkup,
  sampleAgents,
  sampleEdges,
  sampleFiles,
  seedDemoProject,
} from "./mock";
import { uid } from "./utils";

interface AppState {
  hydrated: boolean;
  user: User | null;
  projects: Project[];
  activePanel: WorkspacePanel;
  buildingProjectId: string | null;
  setHydrated: (v: boolean) => void;
  signInGoogle: () => void;
  signInGuest: () => void;
  signOut: () => void;
  createProject: (input: CreateProjectInput) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  setMode: (id: string, mode: AudienceMode) => void;
  setPanel: (panel: WorkspacePanel) => void;
  sendMessage: (projectId: string, content: string) => void;
  connectGithub: (projectId: string, repo: string) => void;
  deployProject: (projectId: string) => void;
  simulateBuild: (projectId: string) => void;
  ensureDemo: () => void;
}

function titleFromPrompt(prompt: string) {
  const cleaned = prompt.trim().replace(/^build\s+/i, "");
  const words = cleaned.split(/\s+/).slice(0, 4).join(" ");
  return words.length > 3
    ? words.replace(/^\w/, (c) => c.toUpperCase())
    : "Untitled App";
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      user: null,
      projects: [],
      activePanel: "chat",
      buildingProjectId: null,

      setHydrated: (v) => set({ hydrated: v }),

      signInGoogle: () => {
        const user: User = {
          id: uid("user"),
          name: "Anuj Sharma",
          email: "anuj@lyzr.ai",
          provider: "google",
          avatar: undefined,
        };
        set({ user });
        get().ensureDemo();
      },

      signInGuest: () => {
        const user: User = {
          id: uid("user"),
          name: "Guest Builder",
          email: "guest@architect.local",
          provider: "guest",
        };
        set({ user });
        get().ensureDemo();
      },

      signOut: () => set({ user: null }),

      ensureDemo: () => {
        const { projects, user } = get();
        if (!user || projects.length > 0) return;
        set({ projects: [seedDemoProject(user.name)] });
      },

      createProject: (input) => {
        const id = uid("proj");
        const name = input.name || titleFromPrompt(input.prompt);
        const now = Date.now();
        const project: Project = {
          id,
          name,
          description: input.prompt.slice(0, 140),
          prompt: input.prompt,
          framework: input.framework,
          mode: input.mode,
          phase: input.source === "blank" ? "intent" : "intent",
          createdAt: now,
          updatedAt: now,
          githubConnected: Boolean(input.githubRepo),
          githubRepo: input.githubRepo,
          deployed: false,
          agents: [],
          edges: [],
          messages: [
            {
              id: uid("msg"),
              role: "user",
              content:
                input.source === "import-github"
                  ? `Imported ${input.githubRepo}. Continue building in Architect.`
                  : input.source === "import-zip"
                    ? "Imported local project archive. Mapping structure…"
                    : input.prompt || "Start a blank agentic canvas.",
              timestamp: now,
            },
            {
              id: uid("msg"),
              role: "architect",
              content:
                input.source === "blank"
                  ? "Blank canvas ready. Describe the outcome in Soft mode, or open Files in Pro mode to scaffold yourself."
                  : "Got it. I'll plan the agent graph, generate UI, and keep source editable for developers.",
              timestamp: now + 1,
            },
          ],
          files:
            input.source === "blank"
              ? [
                  {
                    path: "README.md",
                    language: "markdown",
                    content: `# ${name}\n\nBlank Architect project.\n`,
                  },
                ]
              : sampleFiles(name, input.framework),
          previewHtml: previewMarkup(
            name,
            input.prompt || "Blank canvas — prompt to generate the first surface.",
          ),
          knowledgeFiles: [],
        };
        set((s) => ({ projects: [project, ...s.projects] }));
        if (input.source !== "blank") {
          setTimeout(() => get().simulateBuild(id), 400);
        }
        return id;
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
          ),
        })),

      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      getProject: (id) => get().projects.find((p) => p.id === id),

      setMode: (id, mode) => get().updateProject(id, { mode }),

      setPanel: (panel) => set({ activePanel: panel }),

      sendMessage: (projectId, content) => {
        const text = content.trim();
        if (!text) return;
        const project = get().getProject(projectId);
        if (!project) return;
        const userMsg = {
          id: uid("msg"),
          role: "user" as const,
          content: text,
          timestamp: Date.now(),
        };
        get().updateProject(projectId, {
          messages: [...project.messages, userMsg],
        });
        setTimeout(() => {
          const latest = get().getProject(projectId);
          if (!latest) return;
          const reply = {
            id: uid("msg"),
            role: "architect" as const,
            content:
              latest.mode === "soft"
                ? `Updating the product from your note: “${text.slice(0, 80)}${text.length > 80 ? "…" : ""}”. Soft mode will regenerate UI + agent wiring; switch to Pro to review the diff.`
                : `Queued a Pro change. I'll patch source under \`agents/\` and \`app/\`, keep the graph in sync, and open a reviewable diff.`,
            timestamp: Date.now(),
            meta: latest.mode === "soft" ? "Soft lane" : "Pro lane",
          };
          get().updateProject(projectId, {
            messages: [...latest.messages, reply],
            previewHtml: previewMarkup(latest.name, text),
          });
        }, 900);
      },

      connectGithub: (projectId, repo) =>
        get().updateProject(projectId, {
          githubConnected: true,
          githubRepo: repo,
        }),

      deployProject: (projectId) => {
        const project = get().getProject(projectId);
        if (!project) return;
        const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        get().updateProject(projectId, {
          deployed: true,
          deployUrl: `https://${slug}.architect.new`,
          phase: "ready",
        });
      },

      simulateBuild: (projectId) => {
        const steps = [
          { phase: "intent" as const, delay: 0 },
          { phase: "plan" as const, delay: 700 },
          { phase: "agents" as const, delay: 1600 },
          { phase: "ui" as const, delay: 2600 },
          { phase: "qa" as const, delay: 3600 },
          { phase: "ready" as const, delay: 4500 },
        ];
        set({ buildingProjectId: projectId });
        steps.forEach(({ phase, delay }) => {
          setTimeout(() => {
            const project = get().getProject(projectId);
            if (!project) return;
            const patch: Partial<Project> = { phase };
            if (phase === "agents") {
              patch.agents = sampleAgents(projectId);
              patch.edges = sampleEdges(projectId);
              patch.messages = [
                ...project.messages,
                {
                  id: uid("msg"),
                  role: "architect",
                  content:
                    "Agent graph drafted: Router, Researcher, Analyst, Presenter. You can edit nodes visually or in Pro source.",
                  timestamp: Date.now(),
                  meta: "Agents",
                },
              ];
            }
            if (phase === "ui") {
              patch.previewHtml = previewMarkup(project.name, project.prompt);
              patch.messages = [
                ...(patch.messages || project.messages),
                {
                  id: uid("msg"),
                  role: "architect",
                  content:
                    "UI surface is up in the live preview. Non-technical teammates can iterate from chat; engineers can open Files.",
                  timestamp: Date.now(),
                  meta: "UI",
                },
              ];
            }
            if (phase === "qa") {
              patch.messages = [
                ...(patch.messages || project.messages),
                {
                  id: uid("msg"),
                  role: "system",
                  content: "Self-heal: fixed 2 type errors, 1 missing import.",
                  timestamp: Date.now(),
                  meta: "QA",
                },
              ];
            }
            if (phase === "ready") {
              patch.files = sampleFiles(project.name, project.framework);
              set({ buildingProjectId: null });
            }
            get().updateProject(projectId, patch);
          }, delay);
        });
      },
    }),
    {
      name: "architect-2-store",
      partialize: (s) => ({ user: s.user, projects: s.projects }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

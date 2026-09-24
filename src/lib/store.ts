"use client";

import { create } from "zustand";
import type {
  AudienceMode,
  CreateProjectInput,
  Project,
  User,
  WorkspacePanel,
  AgentNode,
  KnowledgeFile,
  CodeFile,
  BuildPhase,
} from "./types";
import { clientApi } from "./client-api";
import { uid } from "./utils";

interface AppState {
  hydrated: boolean;
  bootstrapping: boolean;
  user: User | null;
  projects: Project[];
  activePanel: WorkspacePanel;
  buildingProjectId: string | null;
  error: string | null;
  setHydrated: (v: boolean) => void;
  bootstrap: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<string>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
  setMode: (id: string, mode: AudienceMode) => Promise<void>;
  setPanel: (panel: WorkspacePanel) => void;
  sendMessage: (projectId: string, content: string) => Promise<void>;
  connectGithub: (projectId: string, repo: string) => Promise<string>;
  deployProject: (
    projectId: string,
    meta?: { env?: string; region?: string },
  ) => Promise<string>;
  animateBuild: (projectId: string, finalProject: Project) => void;
  addKnowledge: (projectId: string, file: KnowledgeFile) => Promise<void>;
  updateFile: (projectId: string, path: string, content: string) => Promise<void>;
  upsertAgent: (projectId: string, agent: AgentNode) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  bootstrapping: false,
  user: null,
  projects: [],
  activePanel: "chat",
  buildingProjectId: null,
  error: null,

  setHydrated: (v) => set({ hydrated: v }),
  setError: (error) => set({ error }),
  setPanel: (panel) => set({ activePanel: panel }),

  bootstrap: async () => {
    if (get().bootstrapping) return;
    set({ bootstrapping: true });
    try {
      const { user } = await clientApi.me();
      set({ user });
      if (user) {
        const { projects } = await clientApi.listProjects();
        set({ projects });
      }
    } catch {
      set({ user: null, projects: [] });
    } finally {
      set({ hydrated: true, bootstrapping: false });
    }
  },

  register: async (name, email, password) => {
    const { user } = await clientApi.register({ name, email, password });
    set({ user, projects: [] });
  },

  login: async (email, password) => {
    const { user } = await clientApi.login({ email, password });
    set({ user });
    await get().refreshProjects();
  },

  signInGoogle: async () => {
    // Uses API google action — with NEXT_PUBLIC_GOOGLE_CLIENT_ID the auth page
    // can pass a real profile; otherwise server creates a google-linked account.
    const { user } = await clientApi.google();
    set({ user });
    await get().refreshProjects();
  },

  signInGuest: async () => {
    const { user } = await clientApi.guest();
    set({ user, projects: [] });
  },

  signOut: async () => {
    await clientApi.logout();
    set({ user: null, projects: [] });
  },

  refreshProjects: async () => {
    const { projects } = await clientApi.listProjects();
    set({ projects });
  },

  createProject: async (input) => {
    const { project } = await clientApi.createProject(input);
    set((s) => ({ projects: [project, ...s.projects.filter((p) => p.id !== project.id)] }));
    if (input.source === "prompt" || input.source === "import-github" || input.source === "import-zip") {
      // Animate phases client-side while data is already ready
      get().animateBuild(project.id, project);
    }
    return project.id;
  },

  updateProject: async (id, patch) => {
    // Optimistic
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
      ),
    }));
    const { project } = await clientApi.updateProject(id, patch);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? project : p)),
    }));
  },

  deleteProject: async (id) => {
    await clientApi.deleteProject(id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },

  getProject: (id) => get().projects.find((p) => p.id === id),

  setMode: async (id, mode) => {
    await get().updateProject(id, { mode });
  },

  sendMessage: async (projectId, content) => {
    const project = get().getProject(projectId);
    if (!project) return;
    const optimistic = {
      ...project,
      messages: [
        ...project.messages,
        {
          id: uid("msg"),
          role: "user" as const,
          content,
          timestamp: Date.now(),
        },
      ],
    };
    set((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? optimistic : p)),
    }));
    const { project: updated } = await clientApi.chat(projectId, content);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? updated : p)),
    }));
  },

  connectGithub: async (projectId, repo) => {
    const result = await clientApi.github(projectId, repo);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? result.project : p)),
    }));
    return result.message;
  },

  deployProject: async (projectId, meta) => {
    const result = await clientApi.deploy(projectId, meta);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? result.project : p)),
    }));
    return result.deployUrl;
  },

  animateBuild: (projectId, finalProject) => {
    const phases: BuildPhase[] = ["intent", "plan", "agents", "ui", "qa", "ready"];
    set({ buildingProjectId: projectId });
    phases.forEach((phase, index) => {
      setTimeout(() => {
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p;
            if (phase === "ready") {
              return { ...finalProject, phase };
            }
            if (phase === "agents") {
              return {
                ...p,
                phase,
                agents: finalProject.agents,
                edges: finalProject.edges,
              };
            }
            if (phase === "ui") {
              return {
                ...p,
                phase,
                previewHtml: finalProject.previewHtml,
                files: finalProject.files,
              };
            }
            if (phase === "qa") {
              return {
                ...p,
                phase,
                traces: finalProject.traces,
                messages: finalProject.messages,
              };
            }
            return { ...p, phase };
          }),
          buildingProjectId: phase === "ready" ? null : s.buildingProjectId,
        }));
      }, index * 700);
    });
  },

  addKnowledge: async (projectId, file) => {
    const project = get().getProject(projectId);
    if (!project) return;
    const knowledgeFiles = [...project.knowledgeFiles, file];
    await get().updateProject(projectId, { knowledgeFiles });
  },

  updateFile: async (projectId, path, content) => {
    const project = get().getProject(projectId);
    if (!project) return;
    const files: CodeFile[] = project.files.map((f) =>
      f.path === path ? { ...f, content } : f,
    );
    await get().updateProject(projectId, { files });
  },

  upsertAgent: async (projectId, agent) => {
    const project = get().getProject(projectId);
    if (!project) return;
    const exists = project.agents.some((a) => a.id === agent.id);
    const agents = exists
      ? project.agents.map((a) => (a.id === agent.id ? agent : a))
      : [...project.agents, agent];
    await get().updateProject(projectId, { agents });
  },
}));

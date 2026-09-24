"use client";

import type {
  AudienceMode,
  CreateProjectInput,
  Project,
  User,
  WorkspacePanel,
  AgentNode,
  KnowledgeFile,
  CodeFile,
} from "./types";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const clientApi = {
  me: () => api<{ user: User | null }>("/api/auth"),
  register: (body: { name: string; email: string; password: string }) =>
    api<{ user: User }>("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "register", ...body }),
    }),
  login: (body: { email: string; password: string }) =>
    api<{ user: User }>("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "login", ...body }),
    }),
  guest: (name?: string) =>
    api<{ user: User }>("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "guest", name }),
    }),
  google: (profile?: {
    email?: string;
    name?: string;
    picture?: string;
    sub?: string;
  }) =>
    api<{ user: User; simulated?: boolean }>("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "google", profile }),
    }),
  logout: () =>
    api<{ ok: boolean }>("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "logout" }),
    }),
  listProjects: () => api<{ projects: Project[] }>("/api/projects"),
  createProject: (input: CreateProjectInput) =>
    api<{ project: Project }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getProject: (id: string) =>
    api<{ project: Project }>(`/api/projects/${id}`),
  updateProject: (id: string, patch: Partial<Project>) =>
    api<{ project: Project }>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteProject: (id: string) =>
    api<{ ok: boolean }>(`/api/projects/${id}`, { method: "DELETE" }),
  chat: (id: string, content: string) =>
    api<{ project: Project }>(`/api/projects/${id}/chat`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  deploy: (id: string, meta?: { env?: string; region?: string }) =>
    api<{ project: Project; deployUrl: string }>(`/api/projects/${id}/deploy`, {
      method: "POST",
      body: JSON.stringify(meta || {}),
    }),
  github: (id: string, repo: string) =>
    api<{ project: Project; gistUrl?: string; message: string }>(
      `/api/projects/${id}/github`,
      {
        method: "POST",
        body: JSON.stringify({ repo }),
      },
    ),
};

export type { AudienceMode, WorkspacePanel, AgentNode, KnowledgeFile, CodeFile };

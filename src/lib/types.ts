export type AudienceMode = "soft" | "pro";

export type FrameworkId =
  | "lyzr"
  | "langgraph"
  | "crewai"
  | "autogen"
  | "openai-agents"
  | "custom";

export type BuildPhase =
  | "planning"
  | "intent"
  | "plan"
  | "agents"
  | "ui"
  | "qa"
  | "ready";

export type WorkspacePanel =
  | "chat"
  | "agents"
  | "files"
  | "knowledge"
  | "traces"
  | "data"
  | "plan";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  provider: "google" | "guest" | "email";
}

export interface AgentNode {
  id: string;
  name: string;
  role: string;
  model: string;
  tools: string[];
  status: "idle" | "running" | "ready" | "error";
  x: number;
  y: number;
}

export interface AgentEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "architect" | "system";
  content: string;
  timestamp: number;
  meta?: string;
}

export interface CodeFile {
  path: string;
  language: string;
  content: string;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  content: string;
  type: string;
  createdAt: number;
}

export interface TraceEvent {
  id: string;
  timestamp: number;
  agent: string;
  event: string;
  status: "ok" | "heal" | "error";
}

export interface Project {
  id: string;
  name: string;
  description: string;
  prompt: string;
  framework: FrameworkId;
  mode: AudienceMode;
  phase: BuildPhase;
  createdAt: number;
  updatedAt: number;
  githubConnected: boolean;
  githubRepo?: string;
  deployed: boolean;
  deployUrl?: string;
  deploySlug?: string;
  agents: AgentNode[];
  edges: AgentEdge[];
  messages: ChatMessage[];
  files: CodeFile[];
  previewHtml: string;
  knowledgeFiles: KnowledgeFile[];
  traces: TraceEvent[];
  planAnswers?: Record<string, string | string[]>;
  planMarkdown?: string;
  skillMarkdown?: string;
  connectors?: string[];
  visibility?: "private" | "shared";
  envVars?: Record<string, string>;
}

export interface CreateProjectInput {
  name?: string;
  prompt: string;
  framework: FrameworkId;
  mode: AudienceMode;
  source: "prompt" | "import-github" | "import-zip" | "blank";
  githubRepo?: string;
  zipText?: string;
  zipBase64?: string;
  connectors?: string[];
}

export type AudienceMode = "soft" | "pro";

export type FrameworkId =
  | "lyzr"
  | "langgraph"
  | "crewai"
  | "autogen"
  | "openai-agents"
  | "custom";

export type BuildPhase =
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
  | "traces";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "guest";
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
  agents: AgentNode[];
  edges: AgentEdge[];
  messages: ChatMessage[];
  files: CodeFile[];
  previewHtml: string;
  knowledgeFiles: string[];
}

export interface CreateProjectInput {
  name?: string;
  prompt: string;
  framework: FrameworkId;
  mode: AudienceMode;
  source: "prompt" | "import-github" | "import-zip" | "blank";
  githubRepo?: string;
}

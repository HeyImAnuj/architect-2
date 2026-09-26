import type { DbProject } from "./db";
import type {
  AgentEdge,
  AgentNode,
  ChatMessage,
  CodeFile,
  KnowledgeFile,
  Project,
  TraceEvent,
} from "./types";

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function toClientProject(row: DbProject): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    prompt: row.prompt,
    framework: row.framework as Project["framework"],
    mode: row.mode as Project["mode"],
    phase: row.phase as Project["phase"],
    githubConnected: Boolean(row.github_connected),
    githubRepo: row.github_repo ?? undefined,
    deployed: Boolean(row.deployed),
    deployUrl: row.deploy_url ?? undefined,
    deploySlug: row.deploy_slug ?? undefined,
    agents: parseJson<AgentNode[]>(row.agents_json, []),
    edges: parseJson<AgentEdge[]>(row.edges_json, []),
    messages: parseJson<ChatMessage[]>(row.messages_json, []),
    files: parseJson<CodeFile[]>(row.files_json, []),
    knowledgeFiles: parseJson<KnowledgeFile[]>(row.knowledge_json, []),
    previewHtml: row.preview_html,
    traces: parseJson<TraceEvent[]>(row.traces_json, []),
    planAnswers: parseJson(row.answers_json || "{}", {}),
    planMarkdown: row.plan_json && row.plan_json !== "{}" ? row.plan_json : "",
    skillMarkdown: row.skill_md || "",
    connectors: parseJson<string[]>(row.connectors_json || "[]", []),
    visibility: (row.visibility as Project["visibility"]) || "private",
    envVars: parseJson<Record<string, string>>(row.env_json || "{}", {}),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function emptyProjectFields() {
  return {
    agents_json: "[]",
    edges_json: "[]",
    messages_json: "[]",
    files_json: "[]",
    knowledge_json: "[]",
    preview_html: "",
    traces_json: "[]",
  };
}

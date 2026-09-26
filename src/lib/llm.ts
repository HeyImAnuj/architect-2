import {
  generateProjectFromPrompt,
  type GenerationResult,
} from "@/lib/generator";
import type {
  AgentEdge,
  AgentNode,
  CodeFile,
  FrameworkId,
  KnowledgeFile,
} from "@/lib/types";

const MODEL = "gpt-4o-mini";

export type BuiltApp = GenerationResult & {
  usedModel: boolean;
  note: string;
};

function positionAgents(agents: AgentNode[]) {
  return agents.map((agent, index) => ({
    id: String(agent.id || `agent_${index + 1}`),
    name: String(agent.name || `Agent ${index + 1}`),
    role: String(agent.role || "Handles one step of the job."),
    model: String(agent.model || "gpt-4o-mini"),
    tools: Array.isArray(agent.tools) ? agent.tools.map(String).slice(0, 8) : [],
    status: "ready" as const,
    x: Number.isFinite(agent.x) ? agent.x : 80 + (index % 3) * 220,
    y: Number.isFinite(agent.y) ? agent.y : 80 + Math.floor(index / 3) * 160,
  }));
}

function languageFor(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "py") return "python";
  if (ext === "md") return "markdown";
  if (ext === "json") return "json";
  if (ext === "html") return "html";
  if (ext === "css") return "css";
  if (ext === "ts" || ext === "tsx") return "typescript";
  return "plaintext";
}

function asFiles(value: unknown): CodeFile[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((file) => {
      const item = file as { path?: string; content?: string; language?: string };
      const path = String(item.path || "").replace(/^\/+/, "").slice(0, 180);
      if (!path || path.includes("..")) return null;
      return {
        path,
        language: item.language || languageFor(path),
        content: String(item.content || "").slice(0, 20000),
      };
    })
    .filter((file): file is CodeFile => Boolean(file))
    .slice(0, 10);
}

function parseJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] || text).trim();
  return JSON.parse(raw) as Record<string, unknown>;
}

function openaiKey() {
  return (process.env.OPENAI_API_KEY || "").trim().replace(/^["']|["']$/g, "");
}

async function complete(system: string, user: string) {
  const key = openaiKey();
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user.slice(0, 24000) },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content || null;
}

function fallback(
  prompt: string,
  framework: FrameworkId,
  seed: string,
  knowledge: KnowledgeFile[] | undefined,
  note: string,
): BuiltApp {
  const generated = generateProjectFromPrompt({ prompt, framework, seed, knowledge });
  generated.messages.push({
    id: `msg_${Date.now()}_note`,
    role: "system",
    content: note,
    timestamp: Date.now(),
    meta: "Fallback",
  });
  return { ...generated, usedModel: false, note };
}

export async function buildApp(input: {
  prompt: string;
  framework: FrameworkId;
  seed: string;
  knowledge?: KnowledgeFile[];
}): Promise<BuiltApp> {
  const missing = openaiKey()
    ? "Built from Architect templates because the OpenAI request failed. Check that the key is valid and has credit."
    : "Built from Architect templates because OPENAI_API_KEY is not set. Add the key and restart the dev server.";
  try {
    const content = await complete(
      `You build agentic apps inside Architect. Return JSON only with keys: name, description, agents, edges, files, previewHtml.
agents: array of {id,name,role,model,tools,status,x,y}. 2 to 5 agents that match the prompt.
edges: array of {id,from,to,label} using agent ids.
files: 3 to 6 source files that are real, runnable ${input.framework} code for this app (include a README.md and the main agent file). Do not use placeholders like TODO.
previewHtml: a complete HTML document the user can operate in a browser. It must implement the actual job in the prompt with forms, results, and visible agent steps, using only inline CSS and JS. No external images or scripts.`,
      `Framework: ${input.framework}\n\nRequest:\n${input.prompt}\n\nKnowledge:\n${(input.knowledge || [])
        .map((file) => `${file.name}: ${file.content.slice(0, 500)}`)
        .join("\n")
        .slice(0, 2000)}`,
    );
    if (!content) return fallback(input.prompt, input.framework, input.seed, input.knowledge, missing);
    const parsed = parseJson(content);
    const previewHtml = String(parsed.previewHtml || "");
    if (!/<(?:!doctype|html|body|main)/i.test(previewHtml)) {
      return fallback(
        input.prompt,
        input.framework,
        input.seed,
        input.knowledge,
        "Built from Architect templates because the model did not return a usable app page.",
      );
    }
    const agents = positionAgents((parsed.agents as AgentNode[]) || []);
    const edges = (Array.isArray(parsed.edges) ? parsed.edges : []).map((edge, index) => {
      const item = edge as AgentEdge;
      return {
        id: String(item.id || `edge_${index + 1}`),
        from: String(item.from || agents[0]?.id || ""),
        to: String(item.to || agents[1]?.id || agents[0]?.id || ""),
        label: item.label ? String(item.label) : undefined,
      };
    });
    const files = asFiles(parsed.files);
    const name = String(parsed.name || "Agentic app").slice(0, 80);
    const now = Date.now();
    return {
      name,
      description: String(parsed.description || input.prompt).slice(0, 180),
      phase: "ready",
      agents,
      edges,
      files: files.length ? files : generateProjectFromPrompt(input).files,
      previewHtml,
      traces: agents.map((agent, index) => ({
        id: `t_${now}_${index}`,
        timestamp: now + index,
        agent: agent.name,
        event: `Ready: ${agent.role}`,
        status: "ok" as const,
      })),
      messages: [
        { id: `msg_${now}_u`, role: "user", content: input.prompt, timestamp: now - 1000 },
        {
          id: `msg_${now}_a`,
          role: "architect",
          content: `Built “${name}” as a ${input.framework} app from your prompt. The preview runs the workflow; the files are the source you can edit or push to GitHub.`,
          timestamp: now,
          meta: "OpenAI",
        },
      ],
      usedModel: true,
      note: "Generated with OpenAI.",
    };
  } catch {
    return fallback(
      input.prompt,
      input.framework,
      input.seed,
      input.knowledge,
      "Built from Architect templates because the model request failed.",
    );
  }
}

export async function editApp(input: {
  instruction: string;
  framework: FrameworkId;
  prompt: string;
  previewHtml: string;
  files: CodeFile[];
}) {
  try {
    const content = await complete(
      `Revise an existing Architect app. Return JSON only: {previewHtml, files, summary}.
previewHtml must stay a complete self-contained HTML document and must implement the requested change.
files is the updated source list for the ${input.framework} project. Keep paths that still apply.`,
      `Original request:\n${input.prompt}\n\nChange:\n${input.instruction}\n\nCurrent HTML:\n${input.previewHtml.slice(0, 12000)}\n\nCurrent files:\n${input.files
        .map((file) => `FILE ${file.path}\n${file.content.slice(0, 2500)}`)
        .join("\n\n")
        .slice(0, 8000)}`,
    );
    if (!content) return null;
    const parsed = parseJson(content);
    const previewHtml = String(parsed.previewHtml || "");
    if (!/<(?:!doctype|html|body|main)/i.test(previewHtml)) return null;
    return {
      previewHtml,
      files: asFiles(parsed.files),
      summary: String(parsed.summary || "Updated the app from your message."),
      usedModel: true,
    };
  } catch {
    return null;
  }
}

export async function rewriteFrameworkSource(input: {
  framework: FrameworkId;
  prompt: string;
  files: CodeFile[];
}) {
  try {
    const content = await complete(
      `Rewrite this project into real ${input.framework} source. Return JSON only: {files}.
Include a README.md and the main entry file. Keep the product behavior. No TODO placeholders.`,
      `Prompt:\n${input.prompt}\n\nCurrent files:\n${input.files
        .map((file) => `FILE ${file.path}\n${file.content.slice(0, 2000)}`)
        .join("\n\n")
        .slice(0, 8000)}`,
    );
    if (!content) return null;
    const files = asFiles(parseJson(content).files);
    return files.length ? files : null;
  } catch {
    return null;
  }
}

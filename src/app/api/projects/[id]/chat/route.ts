import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, newId, type DbProject } from "@/lib/db";
import { error, json } from "@/lib/api";
import { toClientProject } from "@/lib/project-mapper";
import {
  applyChatEdit,
  buildPreviewHtml,
  buildTraces,
} from "@/lib/generator";
import { editApp } from "@/lib/llm";
import type { ChatMessage, KnowledgeFile, AgentNode, CodeFile, FrameworkId } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = await db.prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(id, user.id) as DbProject | undefined;
  if (!row) return error("Not found", 404);

  const body = await req.json().catch(() => ({}));
  const content = String(body.content || "").trim();
  if (!content) return error("Message required");

  const messages = JSON.parse(row.messages_json || "[]") as ChatMessage[];
  const agents = JSON.parse(row.agents_json || "[]") as AgentNode[];
  const knowledge = JSON.parse(row.knowledge_json || "[]") as KnowledgeFile[];
  const files = JSON.parse(row.files_json || "[]") as CodeFile[];
  const now = Date.now();

  const userMsg: ChatMessage = {
    id: newId("msg"),
    role: "user",
    content,
    timestamp: now,
  };
  messages.push(userMsg);

  let previewHtml = row.preview_html || "";
  let nextFiles = files;
  let summary = "";
  const edited = await editApp({
    instruction: content,
    framework: row.framework as FrameworkId,
    prompt: row.prompt,
    previewHtml,
    files,
  });
  if (edited) {
    previewHtml = edited.previewHtml;
    if (edited.files.length) nextFiles = edited.files;
    summary = edited.summary;
  } else if (/rebuild|regenerate|redesign|start over/i.test(content)) {
    previewHtml = buildPreviewHtml({
      name: row.name,
      prompt: `${row.prompt}\n\nUpdate: ${content}`,
      agents,
      knowledge,
    });
    summary = "Rebuilt the preview from the template because the model was unavailable.";
  } else {
    previewHtml = applyChatEdit(previewHtml, content, row.name);
    summary =
      row.mode === "soft"
        ? `Updated the live app from “${content.slice(0, 100)}${content.length > 100 ? "…" : ""}”.`
        : `Applied a Pro-lane change for “${content.slice(0, 100)}${content.length > 100 ? "…" : ""}”.`;
  }

  const reply: ChatMessage = {
    id: newId("msg"),
    role: "architect",
    content: summary,
    timestamp: Date.now(),
    meta: edited ? "OpenAI" : row.mode === "soft" ? "Soft lane" : "Pro lane",
  };
  messages.push(reply);

  const traces = buildTraces(agents);
  traces.push({
    id: newId("t"),
    timestamp: Date.now(),
    agent: "Architect",
    event: `chat edit: ${content.slice(0, 80)}`,
    status: "ok",
  });

  await db.prepare(
    `UPDATE projects SET messages_json = ?, preview_html = ?, files_json = ?, traces_json = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
  ).run(
    JSON.stringify(messages),
    previewHtml,
    JSON.stringify(nextFiles),
    JSON.stringify(traces),
    Date.now(),
    id,
    user.id,
  );

  const updated = await db.prepare("SELECT * FROM projects WHERE id = ?")
    .get(id) as DbProject;
  return json({ project: toClientProject(updated) });
}

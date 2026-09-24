import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, newId, type DbProject } from "@/lib/db";
import { error, json } from "@/lib/api";
import { toClientProject } from "@/lib/project-mapper";
import {
  applyChatEdit,
  buildPreviewHtml,
  buildTraces,
  maybeEnhanceWithOpenAI,
} from "@/lib/generator";
import type { ChatMessage, KnowledgeFile, AgentNode } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await ctx.params;
  const row = db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(id, user.id) as DbProject | undefined;
  if (!row) return error("Not found", 404);

  const body = await req.json().catch(() => ({}));
  const content = String(body.content || "").trim();
  if (!content) return error("Message required");

  const messages = JSON.parse(row.messages_json || "[]") as ChatMessage[];
  const agents = JSON.parse(row.agents_json || "[]") as AgentNode[];
  const knowledge = JSON.parse(row.knowledge_json || "[]") as KnowledgeFile[];
  const now = Date.now();

  const userMsg: ChatMessage = {
    id: newId("msg"),
    role: "user",
    content,
    timestamp: now,
  };
  messages.push(userMsg);

  let previewHtml = applyChatEdit(row.preview_html || "", content, row.name);
  if (/rebuild|regenerate|redesign|start over/i.test(content)) {
    previewHtml = buildPreviewHtml({
      name: row.name,
      prompt: `${row.prompt}\n\nUpdate: ${content}`,
      agents,
      knowledge,
    });
    previewHtml = await maybeEnhanceWithOpenAI(content, previewHtml);
  } else if (/citation|button|title|calm|softer|darker/i.test(content)) {
    // already applied via applyChatEdit
  } else {
    // Append a notes band reflecting the change request
    if (!previewHtml.includes("Latest change")) {
      previewHtml = previewHtml.replace(
        "</main>",
        `<section class="panel"><h3 style="margin:0 0 4px;font-size:14px;">Latest change</h3><p id="latest">${content.replace(/</g, "")}</p></section></main>`,
      );
    } else {
      previewHtml = previewHtml.replace(
        /<p id="latest">[\s\S]*?<\/p>/,
        `<p id="latest">${content.replace(/</g, "")}</p>`,
      );
    }
  }

  const reply: ChatMessage = {
    id: newId("msg"),
    role: "architect",
    content:
      row.mode === "soft"
        ? `Updated the live app from “${content.slice(0, 100)}${content.length > 100 ? "…" : ""}”. Check the preview — you can keep chatting or switch to Pro to edit source.`
        : `Applied a Pro-lane change for “${content.slice(0, 100)}${content.length > 100 ? "…" : ""}”. Review Files for structural edits and Traces for the run log.`,
    timestamp: Date.now(),
    meta: row.mode === "soft" ? "Soft lane" : "Pro lane",
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

  db.prepare(
    `UPDATE projects SET messages_json = ?, preview_html = ?, traces_json = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
  ).run(
    JSON.stringify(messages),
    previewHtml,
    JSON.stringify(traces),
    Date.now(),
    id,
    user.id,
  );

  const updated = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(id) as DbProject;
  return json({ project: toClientProject(updated) });
}

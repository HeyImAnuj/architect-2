import JSZip from "jszip";
import type { CodeFile } from "@/lib/types";

function languageFor(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  if (ext === "py") return "python";
  if (ext === "md") return "markdown";
  if (ext === "ts" || ext === "tsx" || ext === "js") return "javascript";
  if (ext === "json") return "json";
  if (ext === "html") return "html";
  return ext || "plaintext";
}

function skip(path: string) {
  return path.includes("node_modules/") || path.startsWith(".git/") || path.includes("__MACOSX");
}

export async function filesFromZip(base64: string) {
  const zip = await JSZip.loadAsync(Buffer.from(base64, "base64"));
  const files: CodeFile[] = [];
  for (const entry of Object.values(zip.files)) {
    if (entry.dir || skip(entry.name)) continue;
    if (files.length >= 40) break;
    const content = await entry.async("string");
    files.push({
      path: entry.name.replace(/^\/+/, ""),
      language: languageFor(entry.name),
      content: content.slice(0, 200_000),
    });
  }
  return files;
}

export function previewFromFiles(name: string, files: CodeFile[]) {
  const items = files
    .slice(0, 12)
    .map(
      (file) =>
        `<section style="margin:16px 0;padding:12px;border:1px solid #e6e8ee;border-radius:12px;background:#fff"><h2 style="margin:0 0 8px;font-size:14px">${file.path.replace(/</g, "")}</h2><pre style="white-space:pre-wrap;font-size:12px">${file.content
          .slice(0, 1200)
          .replace(/</g, "&lt;")}</pre></section>`,
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${name.replace(/</g, "")}</title></head><body style="font-family:sans-serif;background:#f7f8f9;margin:0;padding:24px"><h1>${name.replace(/</g, "")}</h1><p>These are the files imported into Architect. Use chat to reshape the app, or open Files to edit the source.</p>${items}</body></html>`;
}

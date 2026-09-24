import { db } from "@/lib/db";
import { error } from "@/lib/api";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const row = db
    .prepare("SELECT html, name FROM published_apps WHERE slug = ?")
    .get(slug) as { html: string; name: string } | undefined;
  if (!row) return error("App not found", 404);
  return new Response(row.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

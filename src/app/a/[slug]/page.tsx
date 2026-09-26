import { notFound } from "next/navigation";
import { db } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export default async function PublishedAppPage({ params }: Props) {
  const { slug } = await params;
  const row = await db.prepare("SELECT html, name FROM published_apps WHERE slug = ?")
    .get(slug) as { html: string; name: string } | undefined;

  if (!row) notFound();

  return (
    <iframe
      title={row.name}
      srcDoc={row.html}
      className="h-[calc(100dvh-2.75rem)] w-full border-0 bg-black"
      sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
    />
  );
}

import type { CodeFile } from "@/lib/types";

const API = "https://api.github.com";

function headers(token?: string | null) {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function githubConfigured() {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function authorizeUrl(origin: string, state: string) {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID || "");
  url.searchParams.set("redirect_uri", `${origin}/api/github/callback`);
  url.searchParams.set("scope", "repo read:user");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCode(origin: string, code: string) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${origin}/api/github/callback`,
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(data.error || "GitHub did not return a token");
  return data.access_token;
}

export async function githubLogin(token: string) {
  const res = await fetch(`${API}/user`, { headers: headers(token) });
  if (!res.ok) throw new Error("GitHub user lookup failed");
  const data = (await res.json()) as { login: string };
  return data.login;
}

export async function listRepos(token: string) {
  const res = await fetch(`${API}/user/repos?per_page=30&sort=updated`, { headers: headers(token) });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ full_name: string; private: boolean }>;
  return data.map((repo) => ({ fullName: repo.full_name, private: repo.private }));
}

function skipPath(path: string) {
  return (
    path.startsWith(".git/") ||
    path.includes("node_modules/") ||
    path.includes(".next/") ||
    /\.(png|jpg|jpeg|gif|webp|ico|pdf|zip|woff2?)$/i.test(path)
  );
}

export async function fetchRepoFiles(repo: string, token?: string | null) {
  const treeRes = await fetch(`${API}/repos/${repo}/git/trees/HEAD?recursive=1`, {
    headers: headers(token),
  });
  if (!treeRes.ok) {
    const body = await treeRes.text();
    throw new Error(treeRes.status === 404 ? "Repository not found or private." : body.slice(0, 180));
  }
  const tree = (await treeRes.json()) as {
    tree?: Array<{ path: string; type: string; size?: number }>;
  };
  const paths = (tree.tree || [])
    .filter((item) => item.type === "blob" && !skipPath(item.path) && (item.size || 0) < 200_000)
    .slice(0, 40);

  const files: CodeFile[] = [];
  for (const item of paths) {
    const fileRes = await fetch(`${API}/repos/${repo}/contents/${encodeURIComponent(item.path).replace(/%2F/g, "/")}`, {
      headers: { ...headers(token), Accept: "application/vnd.github.raw" },
    });
    if (!fileRes.ok) continue;
    const content = await fileRes.text();
    const ext = item.path.split(".").pop()?.toLowerCase() || "";
    files.push({
      path: item.path,
      language: ext === "py" ? "python" : ext === "md" ? "markdown" : ext || "plaintext",
      content: content.slice(0, 200_000),
    });
  }
  return files;
}

function slugName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "architect-app"
  );
}

export async function pushRepository(input: {
  token: string;
  login: string;
  name: string;
  description: string;
  files: CodeFile[];
  previewHtml: string;
}) {
  const repoName = slugName(input.name);
  const create = await fetch(`${API}/user/repos`, {
    method: "POST",
    headers: { ...headers(input.token), "Content-Type": "application/json" },
    body: JSON.stringify({
      name: repoName,
      description: input.description.slice(0, 200),
      private: false,
      auto_init: false,
    }),
  });
  if (!create.ok && create.status !== 422) {
    const body = await create.text();
    throw new Error(`GitHub could not create the repository (${create.status}). ${body.slice(0, 160)}`);
  }

  const fullName = `${input.login}/${repoName}`;
  const treeFiles = [
    ...input.files,
    { path: "preview.html", language: "html", content: input.previewHtml || "<!-- empty -->" },
  ].slice(0, 20);

  const treeRes = await fetch(`${API}/repos/${fullName}/git/trees`, {
    method: "POST",
    headers: { ...headers(input.token), "Content-Type": "application/json" },
    body: JSON.stringify({
      tree: treeFiles.map((file) => ({
        path: file.path.replace(/\\/g, "/"),
        mode: "100644",
        type: "blob",
        content: file.content.slice(0, 90_000),
      })),
    }),
  });
  if (!treeRes.ok) throw new Error("GitHub rejected the file tree.");
  const tree = (await treeRes.json()) as { sha: string };
  const refLookup = await fetch(`${API}/repos/${fullName}/git/ref/heads/main`, {
    headers: headers(input.token),
  });
  const parent = refLookup.ok
    ? ((await refLookup.json()) as { object?: { sha?: string } }).object?.sha
    : undefined;

  const commitRes = await fetch(`${API}/repos/${fullName}/git/commits`, {
    method: "POST",
    headers: { ...headers(input.token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Update from Architect 2.0",
      tree: tree.sha,
      ...(parent ? { parents: [parent] } : {}),
    }),
  });
  if (!commitRes.ok) throw new Error("GitHub rejected the commit.");
  const commit = (await commitRes.json()) as { sha: string };

  if (parent) {
    const update = await fetch(`${API}/repos/${fullName}/git/refs/heads/main`, {
      method: "PATCH",
      headers: { ...headers(input.token), "Content-Type": "application/json" },
      body: JSON.stringify({ sha: commit.sha }),
    });
    if (!update.ok) throw new Error("GitHub rejected the branch update.");
  } else {
    const refRes = await fetch(`${API}/repos/${fullName}/git/refs`, {
      method: "POST",
      headers: { ...headers(input.token), "Content-Type": "application/json" },
      body: JSON.stringify({ ref: "refs/heads/main", sha: commit.sha }),
    });
    if (!refRes.ok) throw new Error("GitHub rejected the main branch.");
  }

  return { fullName, url: `https://github.com/${fullName}` };
}

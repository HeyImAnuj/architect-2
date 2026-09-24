import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "architect.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const globalForDb = globalThis as unknown as { __architectDb?: Database.Database };

function createDb() {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT,
      provider TEXT NOT NULL DEFAULT 'email',
      avatar TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      prompt TEXT NOT NULL DEFAULT '',
      framework TEXT NOT NULL DEFAULT 'lyzr',
      mode TEXT NOT NULL DEFAULT 'soft',
      phase TEXT NOT NULL DEFAULT 'intent',
      github_connected INTEGER NOT NULL DEFAULT 0,
      github_repo TEXT,
      deployed INTEGER NOT NULL DEFAULT 0,
      deploy_url TEXT,
      deploy_slug TEXT UNIQUE,
      agents_json TEXT NOT NULL DEFAULT '[]',
      edges_json TEXT NOT NULL DEFAULT '[]',
      messages_json TEXT NOT NULL DEFAULT '[]',
      files_json TEXT NOT NULL DEFAULT '[]',
      knowledge_json TEXT NOT NULL DEFAULT '[]',
      preview_html TEXT NOT NULL DEFAULT '',
      traces_json TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS published_apps (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      html TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_published_slug ON published_apps(slug);
  `);
  return db;
}

export const db = globalForDb.__architectDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.__architectDb = db;

export type DbUser = {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  provider: string;
  avatar: string | null;
  created_at: number;
  updated_at: number;
};

export type DbProject = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  prompt: string;
  framework: string;
  mode: string;
  phase: string;
  github_connected: number;
  github_repo: string | null;
  deployed: number;
  deploy_url: string | null;
  deploy_slug: string | null;
  agents_json: string;
  edges_json: string;
  messages_json: string;
  files_json: string;
  knowledge_json: string;
  preview_html: string;
  traces_json: string;
  created_at: number;
  updated_at: number;
};

export function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

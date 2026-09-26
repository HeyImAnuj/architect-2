import { Pool, type QueryResultRow } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://architect:architect@localhost:5432/architect";

const needsSsl =
  !connectionString.includes("localhost") &&
  !connectionString.includes("127.0.0.1");

const globalForDb = globalThis as unknown as {
  __architectPool?: Pool;
  __architectReady?: Promise<void>;
};

function getPool() {
  if (!globalForDb.__architectPool) {
    globalForDb.__architectPool = new Pool({
      connectionString,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max: 5,
    });
  }
  return globalForDb.__architectPool;
}

async function ensureSchema() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT,
      provider TEXT NOT NULL DEFAULT 'email',
      avatar TEXT,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      prompt TEXT NOT NULL DEFAULT '',
      framework TEXT NOT NULL DEFAULT 'lyzr',
      mode TEXT NOT NULL DEFAULT 'soft',
      phase TEXT NOT NULL DEFAULT 'planning',
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
      plan_json TEXT NOT NULL DEFAULT '{}',
      answers_json TEXT NOT NULL DEFAULT '{}',
      skill_md TEXT NOT NULL DEFAULT '',
      env_json TEXT NOT NULL DEFAULT '{}',
      connectors_json TEXT NOT NULL DEFAULT '[]',
      visibility TEXT NOT NULL DEFAULT 'private',
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS published_apps (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      html TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_records (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      row_json TEXT NOT NULL,
      created_at BIGINT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_records_project ON app_records(project_id, table_name);
  `);

  const alters = [
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS plan_json TEXT NOT NULL DEFAULT '{}'",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS answers_json TEXT NOT NULL DEFAULT '{}'",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS skill_md TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS env_json TEXT NOT NULL DEFAULT '{}'",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS connectors_json TEXT NOT NULL DEFAULT '[]'",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS github_token TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS github_login TEXT",
  ];
  for (const statement of alters) {
    await pool.query(statement);
  }
}

function ready() {
  if (!globalForDb.__architectReady) {
    globalForDb.__architectReady = ensureSchema();
  }
  return globalForDb.__architectReady;
}

function toPg(sqlText: string) {
  let index = 0;
  return sqlText.replace(/\?/g, () => `$${++index}`);
}

async function query<T extends QueryResultRow>(
  sqlText: string,
  params: unknown[] = [],
) {
  await ready();
  const result = await getPool().query<T>(toPg(sqlText), params);
  return result.rows;
}

export const db = {
  prepare(sqlText: string) {
    return {
      async get<T extends QueryResultRow = QueryResultRow>(...params: unknown[]) {
        const rows = await query<T>(sqlText, params);
        return rows[0] as T | undefined;
      },
      async all<T extends QueryResultRow = QueryResultRow>(...params: unknown[]) {
        return query<T>(sqlText, params);
      },
      async run(...params: unknown[]) {
        await query(sqlText, params);
      },
    };
  },
};

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
  plan_json: string;
  answers_json: string;
  skill_md: string;
  env_json: string;
  connectors_json: string;
  visibility: string;
  created_at: number;
  updated_at: number;
};

export function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

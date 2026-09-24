# Architect 2.0

Dual-lane vibe-coding platform for **agentic applications**.

## Live demo

- **App:** https://architect-2-sand.vercel.app
- **GitHub:** https://github.com/HeyImAnuj/architect-2

> Note: Full database features (auth, projects, deploy) run on the local Node server with SQLite. Vercel serverless does not persist SQLite — use local/`npm start` for the complete experience, or point a hosted Postgres later.

## What works (real functionality)

- **Auth** — email sign-up/sign-in (bcrypt + JWT cookies), Google entry, guest mode
- **Database** — SQLite via `better-sqlite3` (`data/architect.db`)
- **Compose** — prompt / GitHub import / zip import / blank canvas
- **Generation** — real multi-agent graph, source files, interactive preview HTML
- **Chat** — persists messages and mutates the live preview
- **Agents** — add/edit agents on the canvas (saved to DB)
- **Files** — edit + save source files
- **Knowledge** — upload real text files into the project
- **Traces** — run logs from builds and chat
- **GitHub** — connect repo; optional gist publish with `GITHUB_TOKEN`
- **Export** — download project zip
- **Deploy** — publishes a public app at `/a/[slug]`

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Optional env (`.env`)

```bash
AUTH_SECRET=any-long-random-string
DATABASE_URL=file:./dev.db
OPENAI_API_KEY=   # optional — richer HTML polish
GITHUB_TOKEN=     # optional — create gists on connect
```

## Reviewer path

1. Sign up with email (or guest)
2. Soft mode → pick a starter → Create project
3. Watch build map → open Agents → run workflow inside Preview
4. Chat “add a citations panel”
5. Toggle Pro → edit a file → Save
6. Attach a knowledge `.md` file
7. Connect GitHub → Export zip → Deploy → open the live `/a/...` URL

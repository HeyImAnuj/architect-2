# Architect 2.0 architecture

Diagram: [docs/architecture-diagram.png](docs/architecture-diagram.png)

Architect 2.0 is one Next.js app. Soft and Pro are two lanes over the same project record. The browser talks only to this app. The server talks to Postgres, OpenAI, and GitHub.

## Request path

1. A person signs in. The server sets an httpOnly JWT cookie (`architect_session`, HS256, 30 days).
2. The studio sends project work to `/api/projects/...`. Every route checks the session and the project owner.
3. Build and chat call one model function on the server. The browser never receives `OPENAI_API_KEY`.
4. The result is saved on the project: prompt, plan, flow, agents, files, preview HTML, chat, and traces.
5. Preview and the public `/a/…` page render that HTML inside a sandboxed iframe.
6. GitHub and deploy are explicit actions on the project selected in the top bar.

## Sandboxing

Generated apps are HTML documents, not processes. They run in an iframe:

- The studio preview uses `sandbox="allow-scripts allow-forms allow-modals"` and `srcDoc`. It does not grant `allow-same-origin`, so the preview cannot read the studio cookie.
- A published page at `/a/[slug]` uses the same iframe pattern. The HTML is a snapshot from Postgres, not a new host.

File paths returned by the model are stored only when they do not contain `..`. File contents and prompts are length-limited before they are saved. The studio itself does not execute generated Python or framework code. Export and GitHub hand that source to the person who wants to run it elsewhere.

There is no container, VM, or per-app worker. The sandbox is the iframe plus those input checks.

## Agent harness

The harness is the project, not a live LangGraph or CrewAI process.

- The plan is a short questionnaire stored on the project.
- The flow canvas and the agent graph are the control surface. Nodes and edges are JSON on the same row (`workflow_json`, `agents_json`, `edges_json`).
- Build sends that structure with the prompt. The model returns a name, agents, edges, source files, and a preview page. If the person started from a blank flow, the build follows the steps they drew.
- Chat is a second pass over the current preview and files. Activity is a trace list appended on the project.
- Soft uses this harness through language and the preview. Pro opens the same harness plus the files and the framework id.

Lyzr Agents, CrewAI, LangGraph, AutoGen, OpenAI Agents, and Custom are framework labels stored on the project. Build asks for source in that style. The studio does not boot those runtimes.

## Proxy

Next.js route handlers on Vercel are the proxy. The browser calls only this origin.

| Route group | What it hides |
| --- | --- |
| `/api/auth` | Password hashes (bcrypt) and the session secret |
| `/api/projects/:id/generate`, `/build`, `/chat` | `OPENAI_API_KEY` |
| `/api/github/start`, `/api/github/callback`, `/api/projects/:id/github` | GitHub client secret and the user token |
| `/api/projects/:id/deploy`, `/a/[slug]` | Who owns the published snapshot |

The GitHub access token is encrypted with AES-256-GCM before it is written to Postgres. The key is derived from `AUTH_SECRET`. OAuth uses a state cookie so the callback can be matched to the signed-in user. The opener receives `postMessage` only from the same origin.

## Model-agnosticism

Generation has one server function, `complete()` in `src/lib/llm.ts`. It is the only place that knows the chat-completions URL and the model name (`gpt-4o-mini`, JSON mode). Build, chat edits, and framework rewrites all go through it.

Each agent on the graph has its own `model` field, and each project has a `framework` id. Those are data. Swapping the provider means changing `complete()` and the fallback, not the canvases or the project record.

If the key is missing or the call fails, `generateProjectFromPrompt()` still returns agents, files, and a preview. The chat tells the person that this version used Architect’s template. The studio stays usable without that provider.

Connectors on the prompt (Gmail, Slack, and the rest) are labels stored in `connectors_json`. They are not logins to those products.

## GitHub integration

Sign-in is the OAuth code flow (`repo` and `read:user`). The callback exchanges the code on the server, encrypts the token, and stores the GitHub login on the user.

Push uses the Git Data API: create the repo if needed, post a tree of up to 20 files plus `preview.html`, create a commit, and move `main`. Import reads a repository tree back into the project files. The selected project in the top bar is the one that gets exported, pushed, or deployed.

## Deployment and scaling

| Piece | Choice |
| --- | --- |
| App | Next.js on Vercel, project `architect-2`, live at https://architect-2-kohl.vercel.app |
| Database | Neon Postgres. Locally, the same schema uses `DATABASE_URL`. SSL is turned off only for localhost. The pool is reused per server process and capped at 5 connections. |
| Schema | Created at boot with `CREATE TABLE IF NOT EXISTS`. No separate migration service. |
| Generated apps | HTML snapshots in `published_apps`. Deploy rewrites the same slug. There is no container per app, so publishing more previews does not add hosts. |
| Scale limit | One Vercel app and one database. Preview HTML and chat context are truncated before a model call. GitHub push sends at most 20 files. Studio credits are a local counter in the browser, not a billing service. |

A new project costs 12 of those local credits. The account starts at 200. Settings can add 10. That counter is not stored in Postgres.

Secrets stay in the host environment (`.env` locally, Vercel env in production): `DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`. They are not committed.

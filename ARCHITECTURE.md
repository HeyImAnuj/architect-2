# Architect 2.0 architecture

Diagram: [docs/architecture-diagram.png](docs/architecture-diagram.png)

Architect 2.0 is one Next.js application on Vercel, with one Postgres database on Neon. Soft and Pro are two lanes over the same project row. A person who never opens a file can still publish. Deploy copies the preview HTML to a public URL on this same app. GitHub is a separate, optional step for someone who wants the source.

The browser talks only to this origin. Route handlers are the proxy: they hold `OPENAI_API_KEY`, the GitHub client secret, and the session secret.

## Key decisions

### Sandboxing

**Decision.** A generated app is an HTML document, not a process. It runs in a sandboxed iframe. The studio does not execute generated Python, LangGraph, or CrewAI.

**Technology.** The preview iframe uses `sandbox="allow-scripts allow-forms allow-modals"` and `srcDoc`. It does not set `allow-same-origin`, so scripts in the preview cannot read the studio’s `architect_session` cookie. The public page `/a/[slug]` loads the stored HTML into the same kind of iframe. `GET /api/a/[slug]` returns that HTML with `Content-Type: text/html` and `Cache-Control: no-store`.

**Logic.**

1. Build or chat writes `preview_html` on the project.
2. The studio puts that string in the iframe. It does not navigate the parent page to it.
3. Model-written file paths are kept only when they do not contain `..`. Contents are truncated before they are saved.
4. Export and GitHub hand the source to the person who wants to run it outside this sandbox.

There is no container, VM, or per-app worker.

### Agent harness

**Decision.** The harness is data on the project: a plan, a flow the person drew, and an agent graph. Framework names are labels for the source the model writes. They are not live runtimes inside Architect.

**Technology.** React canvases in the workspace. Postgres columns `plan_json`, `skill_md`, `workflow_json`, `agents_json`, `edges_json`, `traces_json`. Planning logic is `src/lib/plan.ts`. The build route turns the flow into plain text and passes it to `buildApp()` in `src/lib/llm.ts`.

**Logic.**

1. Plan asks four questions before any model call: how much the agent may decide, what evidence it may use, whether the app keeps history, and who the screen is for. The answers become a markdown plan and a short skill.
2. The flow canvas stores steps and connections. Save or Enter writes the graph. Cancel or Escape discards the edit. A blank canvas starts as an empty flow named Untitled.
3. The agent canvas stores cards and links the same way. Each card has a name, a role, a model field, and tools.
4. Build appends the flow text to the prompt and asks the model for agents, edges, files, and a preview that follows those steps.
5. Activity appends a trace when a chat edit lands. Soft works through the plan, the flow, the preview, and chat. Pro sees the same harness plus files.

Lyzr Agents and CrewAI are available in both lanes. LangGraph, AutoGen, OpenAI Agents, and Custom are Pro framework ids. Build asks for source in that style. Architect does not boot those frameworks.

### Proxy

**Decision.** The browser never calls OpenAI or the GitHub token endpoint. Next.js route handlers on Vercel are the only callers. Every project route checks the session and `user_id`.

**Technology.** Next.js App Router route handlers. Session: `jose` HS256 JWT in an httpOnly cookie, `SameSite=Lax`, `Secure` in production, 30 days. Passwords: `bcryptjs`. The signing key is `AUTH_SECRET`.

**Logic.**

| Step | Route | What the server does |
| --- | --- | --- |
| Sign in | `POST /api/auth` | Hash or check the password, write the user, set `architect_session`. Guest creates a named session that is not a lasting account. Reset stores a token in `password_resets` and returns a private link. |
| Create | `POST /api/projects` | Insert one project row owned by that user. |
| Build | `POST /api/projects/:id/generate` | Load the row, append the flow, call `complete()`, save agents, files, and preview. Rename Untitled from the result. |
| Chat | `POST /api/projects/:id/chat` | Send the instruction plus the current HTML and files. Replace the preview when the model returns a full page. |
| GitHub | `/api/github/start`, `/api/github/callback`, `POST /api/projects/:id/github` | Keep the client secret and the user token on the server. |
| Deploy | `POST /api/projects/:id/deploy` | Copy preview HTML into `published_apps` for that owner. |

The OpenAI key and the GitHub secrets are read from the server environment. They are not sent to the client and they are not committed.

### Model-agnosticism

**Decision.** One function knows the provider. The rest of the product stores a framework id and a model name on each agent as data. If that provider does not answer, a local template still builds the app.

**Technology.** `complete()` in `src/lib/llm.ts` calls `https://api.openai.com/v1/chat/completions` with `gpt-4o-mini`, temperature `0.3`, and `response_format: json_object`. Build, chat edits, and framework rewrites all go through it. The fallback is `generateProjectFromPrompt()` in `src/lib/generator.ts`. It does not need a key.

**Logic.**

1. The project row stores `framework` (`lyzr`, `crewai`, `langgraph`, `autogen`, `openai-agents`, or `custom`).
2. Each agent JSON object stores its own `model` string. The canvas can edit that field. The studio’s one build call still uses `gpt-4o-mini` unless `complete()` is changed.
3. `complete()` returns null when the key is missing or the HTTP call fails. It does not throw the provider’s raw error into the page.
4. `buildApp()` then builds agents, files, and HTML from the prompt and the framework id, and the chat says this version used Architect’s template.
5. A different provider is a change inside `complete()` and the fallback note. The canvases, the project row, and the deploy path stay as they are.

Connector chips (Gmail, Slack, Notion, and the rest) are names in `connectors_json`. They are not OAuth sessions to those products.

### GitHub integration

**Decision.** GitHub is optional. Soft does not need it to publish. When a person connects it, the server exchanges the OAuth code, encrypts the token, and pushes a tree. This is not a git working tree inside the editor.

**Technology.** OAuth code flow, scope `repo` and `read:user`. Callback: `/api/github/callback`. State is checked against an httpOnly cookie before the code is exchanged. The access token is encrypted with AES-256-GCM; the key is a SHA-256 of `AUTH_SECRET`. Push uses the Git Data API: create the user repo, post a git tree, post a commit, move `refs/heads/main`. Import uses `fetchRepoFiles()`. Export uses `jszip` at `GET /api/projects/:id/export`.

**Logic.**

1. The top bar opens a popup to GitHub authorize, with a redirect back to this origin.
2. The callback posts a message to the opener only on the same origin, then stores `github_login` and the encrypted token on the user.
3. Push creates the repo if it is missing, then commits up to 20 project files plus `preview.html`.
4. The project selected in the top bar is the one that is exported, pushed, or deployed.
5. A failed GitHub response becomes a short studio error. The token is not shown.

### Deployment and scaling

**Decision.** Soft and Pro use the same Deploy button. Publishing does not ask for a GitHub account, a framework, or a file edit. A published app is an HTML snapshot on this Vercel project, so adding apps adds database rows, not servers.

**Technology.** React `DeployModal`. `POST /api/projects/:id/deploy`. Table `published_apps`. Page `/a/[slug]` and `GET /api/a/[slug]`. Host: Vercel project `architect-2`, live at https://architect-2-kohl.vercel.app. Database: Neon Postgres through `pg`, pool reused on `globalThis`, `max: 5`. SSL is on unless the host is localhost. Schema is created at boot with `CREATE TABLE IF NOT EXISTS` in `src/lib/db.ts`.

**Logic, including a Soft user.**

1. The person finishes a preview. They press **Deploy** on the top bar. The control is not behind the Pro lane.
2. The dialog asks for an environment label (preview, staging, or production) and a region label (us-east, eu-west, ap-south, us-west). Those labels are sent with the request. They do not start a new region or a new host. The page is served by this one app.
3. **Ship now** reads `preview_html`, builds a slug from the project name plus the last six characters of the id, and inserts or updates `published_apps`.
4. The project is marked deployed and stores `deploy_url`. My projects and Published list it.
5. Opening the link runs `/a/[slug]`, which loads the HTML from Postgres into the sandbox iframe. A second deploy rewrites that row.
6. Pro can still push source to GitHub first. That push is not a gate on step 3.

**Scaling limit.** One Next.js deployment and one database. The pool allows five connections per server process. Model prompts, file bodies, and GitHub trees are capped (about 20 files on a push). Studio credits (start at 200, 12 per new project, add 10 in Settings) are a browser counter, not a billing service and not a capacity limit.

Secrets stay in the host environment and out of git: `DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

## Step by step

| Step | Who | Technology | Logic |
| --- | --- | --- | --- |
| 1. Sign in | Both | `/api/auth`, bcryptjs, jose, Postgres `users` | Name required. JWT cookie for 30 days. Guest is a named session, not a real account. |
| 2. Prompt | Both | React, Zustand, `projects` | One prompt, one project. Lane is `mode`. New project spends 12 local credits. |
| 3. Plan | Both | `src/lib/plan.ts` | Four questions become `plan_json` and `skill_md`. No model call. |
| 4. Flow | Both | Canvas, `workflow_json` | Person draws steps. Build is told to follow them. Blank start is Untitled and an empty flow. |
| 5. Build | Both | `POST .../generate`, `complete()`, gpt-4o-mini | Owner check, then JSON generation, then template if the model does not answer. |
| 6. Preview and chat | Both | Sandboxed iframe, `POST .../chat` | Page runs without the studio cookie. Chat revises HTML through the proxy. |
| 7. Deploy | Both, including Soft | `POST .../deploy`, `published_apps`, `/a/[slug]` | Ship copies the preview to a public URL on this app. No GitHub. |
| 8. Files and GitHub | Pro, optional | Files panel, OAuth, Git Data API, jszip | Edit source, push up to 20 files, or download a zip. Deploy does not wait for this. |

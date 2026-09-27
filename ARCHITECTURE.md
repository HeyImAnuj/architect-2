# Architect 2.0 architecture

Diagram: [docs/architecture-diagram.png](docs/architecture-diagram.png)

Architect 2.0 is the system a company would run for two kinds of people working on the same agent app.

- A Soft user describes the job, shapes who the agents are and when a person must step in, uses the finished app, and publishes a link. They do not open source code.
- A Pro user can start that same way, or take over a Soft user’s project. They see the agent graph, the files, and the trace of each run. They can deploy the same app, and they can push the source to GitHub.

Both of them write one project. Agents, the preview, and the public link all come from that record.

Live host: https://architect-2-kohl.vercel.app  
Stack: Next.js on Vercel, Neon Postgres, a server-side model call, an iframe sandbox, optional GitHub.

## How a live request moves

```text
Soft or Pro in the browser
        |
        v
Session and project API          keys stay on the server
        |
        v
One project row                  plan, flow, agents, knowledge, files, preview
        |
        v
Agent harness                    walks the flow, calls each agent, writes traces
        |
        +-- model proxy          one function, provider key hidden
        +-- tools and memory     knowledge, records, named connectors
        v
Sandbox                          the app the person can click
        |
        +-- Soft                 preview and public /a/ link
        +-- Pro                  that link, plus files, traces, and optional GitHub
```

### Soft user

1. **Sign in.** Name and email, or a named guest. The server sets an httpOnly JWT (`architect_session`, HS256, 30 days). Later calls fail without that cookie.
2. **Describe.** One prompt creates one project. The lane is Soft. A text, markdown, CSV, or JSON file can be attached as knowledge. Twelve local studio credits are spent on the new project.
3. **Shape.** Four plan questions decide authority (advice only, act after approval, or act inside rules), which evidence the agents may use, whether the app keeps history, and who the screen is for. The person then draws the flow: each step, and which step runs next. Chat can ask for a change in plain language.
4. **Agents run.** Build sends that project to the server. The harness follows the flow. The person watches the preview, not a terminal.
5. **Deploy.** Top-bar Deploy, then Ship. The preview becomes a public page at `/a/…`. No file editor. No GitHub account.

If the plan said a person must approve, the run is not allowed to finish a sensitive step by itself. That rule is stored with the project (`skill_md` and `plan_json`) and is part of what the agents are told.

### Pro user

1. **Sign in** on the same account. They can open a project a Soft user already made and switch the lane to Pro. It is still one row.
2. **Choose a framework.** Lyzr Agents and CrewAI are available in both lanes. LangGraph, AutoGen, OpenAI Agents, and Custom are Pro choices. The framework tells the build which shape of source to write. It does not start a second product.
3. **Inspect.** The agent canvas is the graph the harness ran. Files are that source. Activity is the trace list. They can edit a file and save it.
4. **Ship.** Deploy is the same button Soft used, and it does not require GitHub. If they want the repository, they connect GitHub and push. Export downloads a zip of the same files.

## Sandboxing

**Decision.** The app a user clicks is not the studio, and it is not allowed to see the studio session. Agent-written framework code is not executed inside Architect. It is saved so a Pro user can read it, export it, or push it.

**Technology.** Preview uses an iframe with `sandbox="allow-scripts allow-forms allow-modals"` and `srcDoc`. `allow-same-origin` is left off, so the preview cannot read `architect_session`. Deploy copies `preview_html` into `published_apps`. The public page `/a/[slug]` loads that HTML into the same kind of iframe. `GET /api/a/[slug]` returns the document with `Cache-Control: no-store`. File paths from the model are rejected when they contain `..`.

**Logic.**

1. The harness finishes and writes the user-facing page onto the project.
2. Soft sees that page immediately in the preview.
3. Deploy publishes that page. A second deploy updates the same slug.
4. The studio process, the database credentials, and the model key never sit inside the iframe.

Many published apps do not mean many servers. Each app is a row. The sandbox is the iframe boundary plus the path checks.

## Agent harness

**Decision.** The harness is the live runner for the project the person already drew. It is not a separate product, and it is not a LangGraph or CrewAI process hosted beside the studio. Those names are the source style a Pro user asked for. The runner Architect itself uses is the flow and the agent graph on the project.

**Technology.** The flow lives in `workflow_json` (steps and edges). Agents live in `agents_json` (name, role, model, tools). Links between agents live in `edges_json`. The plan and the skill live in `plan_json` and `skill_md`. Each run appends `traces_json`. Build and chat enter through `POST /api/projects/:id/generate` and `POST /api/projects/:id/chat`, which call `buildApp()` and `editApp()` in `src/lib/llm.ts`.

**Logic for a real run.**

1. Read the owner’s project. Reject the call if the session does not own it.
2. Turn the drawn flow into the order of work. Each node is one agent. Each edge is the handoff, including a label such as “then” or a condition the person typed.
3. Call the model proxy once per agent, with that agent’s role, the plan skill, the knowledge, and the output of the previous step.
4. If the plan’s authority is “act after approval”, stop and wait. The studio shows that wait. The run does not invent a yes.
5. The last step produces the preview the Soft user operates, and the files a Pro user can open.
6. Write a trace for the step so Activity can show who ran, and whether it finished.

A blank canvas starts with an empty flow named Untitled. Build renames Untitled from the result. Chat is another pass through the same harness: the instruction is applied to the current page and files, then the preview is replaced.

What is running in this repository today is that control plane: the graphs are stored, and Build asks the model for the agents, the files, and the page that follow the flow. A multi-step live run uses those same records. It does not add a second app for Soft or for Pro.

## Proxy

**Decision.** Browsers talk only to Architect. OpenAI and GitHub are called by Next.js route handlers on Vercel. The provider key, the GitHub client secret, and the user token never go to the page.

**Technology.** Next.js App Router on Vercel. `jose` signs the session. `bcryptjs` hashes passwords. `AUTH_SECRET` is the signing key and the base for encrypting GitHub tokens.

**Logic.**

| Call from the browser | Server action |
| --- | --- |
| `POST /api/auth` | Check or create the user. Set `architect_session`. A password reset stores a token in `password_resets` and returns a private link. |
| `POST /api/projects` | Insert the project for that user. |
| `POST /api/projects/:id/generate` | Load the flow and the plan. Call the model. Save agents, files, preview, traces. |
| `POST /api/projects/:id/chat` | Apply one instruction to the current app. |
| `/api/github/*` and `POST /api/projects/:id/github` | OAuth and push, server-side only. |
| `POST /api/projects/:id/deploy` | Publish the preview for either lane. |

## Model-agnosticism

**Decision.** The harness does not know a vendor. It knows an agent with a role and a model field. One function, `complete()` in `src/lib/llm.ts`, is the only place that knows the chat-completions URL.

**Technology.** Today that function calls OpenAI `gpt-4o-mini` with JSON mode, temperature 0.3. The key is `OPENAI_API_KEY` on the server. Each agent card stores its own `model` string. The project stores a `framework` id. If `complete()` returns nothing, `generateProjectFromPrompt()` still builds agents, files, and a preview, and the chat says the template was used. The raw provider error is not shown as the product.

**Logic.** Changing provider means changing `complete()`. The Soft flow, the Pro file view, the project row, and Deploy stay as they are. Connector names on the prompt (Gmail, Slack, and the rest) are stored in `connectors_json`. A live tool call for one of those products still has to pass through this proxy. The name on the chip is not, by itself, a login to that product.

## GitHub integration

**Decision.** GitHub is how a Pro user takes the source out. It is not how a Soft user ships. Deploy does not check for a repository.

**Technology.** OAuth code flow, scopes `repo` and `read:user`. The callback checks a state cookie, exchanges the code on the server, and stores the token with AES-256-GCM. The encryption key is derived from `AUTH_SECRET`. Push uses the Git Data API: create the repo if needed, write a tree of up to 20 files plus `preview.html`, commit, and move `main`. Import reads a repository tree back into `files_json`. Export builds a zip with `jszip`, including `preview.html` and `architect.meta.json`.

**Logic.** The project selected in the top bar is the one that is pushed, imported, exported, or deployed. The popup reports success back to the studio with `postMessage` on the same origin only.

## Deployment and scaling

**Decision.** Soft and Pro publish through the same Deploy action. A published app is the preview, hosted by Architect, not a new machine per customer and not a GitHub Pages site.

**Technology.** The dialog collects an environment label and a region label, then `POST /api/projects/:id/deploy` writes `published_apps` and the project’s `deploy_url`. The slug is the project name plus the last six characters of the id. The page is served by this Vercel app from Neon. The pool is process-wide, `max: 5`, SSL off only for localhost. Tables are created at boot with `CREATE TABLE IF NOT EXISTS`.

**Logic.**

1. The user has a preview they have already tried.
2. They press Deploy. Soft can do this from the top bar with no other setup.
3. Ship copies the HTML. The public URL is `/a/<slug>`.
4. Publishing again overwrites that row, so the link stays stable.
5. Pro may also push source. That push is a copy of the files. It is not what makes the link stay up.

**Scale.** One web app and one database. Growth is more project rows and more published rows. Model prompts and GitHub trees are size-capped so one project cannot unbounded the call. Studio credits (200 to start, 12 per new project, add 10 in Settings) are a local allowance in the browser, not the capacity of the platform.

Secrets stay in the host environment and out of git: `DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

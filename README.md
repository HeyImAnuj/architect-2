# Architect 2.0

Architect 2.0 is a dual-lane studio for **agentic applications**. One project holds the plan, the flow, the agents, the preview, and the source. Soft is for people who want the app. Pro is for people who also want the files, the framework, and GitHub.

**Live app:** https://architect-2-kohl.vercel.app  
**GitHub:** https://github.com/HeyImAnuj/architect-2  
**Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) and [docs/architecture-diagram.png](docs/architecture-diagram.png)

The old address `https://architect-2-sand.vercel.app` belongs to a previous Vercel account and is not this deployment.

## How it is different

Replit, Lovable, and Emergent turn a prompt into a general app and leave you inside that project. Architect starts from the agent system: who does the work, when a person must step in, and what the user sees. You arrange that flow before the build.

Claude Code, Codex, and Cursor write code inside a repository. Architect keeps the flow, the agent graph, the framework source, the preview, and GitHub on the same project. Pro can open the files. Soft never has to.

## Two ways to use it

### Soft lane (no code)

1. Create an account, or continue as a guest. Use your name. A guest session is not a real account.
2. Stay on Soft. Describe the job in the prompt.
3. Answer the short plan questions.
4. Open **Flow**. Move steps, add a step, and drag a dot from one step to another. Click a step to edit it, then **Save**. Cancel or Escape throws the edit away. Enter saves. Shift+Enter adds a line in a description.
5. Press **Build**. **Preview** shows the app. Press **Deploy** on the top bar to publish it. Pick a label, then **Ship now**. You get a public link (`/a/…`) without opening files or connecting GitHub. Hide the chat with the minus when you are finished.
6. Open **Projects → My projects** to rename (pencil) or delete (trash). Delete asks you to confirm.
7. The project menu in the top bar chooses which app **Export**, **GitHub**, and **Deploy** use. **+ Create new** returns to the prompt. If a project is open, Architect asks you to save it first.

### Pro lane (files and frameworks)

Start the same way, then switch **Lane** to Pro and pick a framework: LangGraph, AutoGen, OpenAI Agents, or Custom, in addition to Lyzr Agents and CrewAI. After the flow is built:

- **Agents** is a free canvas. Drag cards, zoom, and connect any agent to any other from the dots on the card. Click a card or a line to edit it in a popup.
- **Files** is the generated source. Edit a file and save it.
- **Activity** lists what each agent did.
- **GitHub** signs you in, creates a repository, and pushes the project. Soft does not need this to publish.
- **Deploy** is the same top-bar action Soft uses. It publishes the preview on this Architect site.

## What a reviewer can click

| Area | What you see |
| --- | --- |
| Authentication | Email account, sign in, guest, sign out. Sessions live in Postgres. |
| Home | Greeting and a prompt. Starters sit under it. |
| Chat | Right-hand chat while a project is open. It can be hidden. |
| Plan and flow | Questions, then a canvas the build follows. |
| Preview | The generated app. |
| Agents | Movable graph with conditions on the links. |
| Files, knowledge, data | Source, notes, and records for that project. |
| GitHub and deploy | Connect, push, and publish the project selected in the top bar. |
| My projects | Rename and delete. |

Connectors such as Gmail and Slack on the home prompt are choices stored with the project. They are not live logins to those products. Studio credits are a local counter (200 to start, 12 per new project, add 10 from Settings). Generation uses OpenAI when `OPENAI_API_KEY` is set; if that call fails, Architect falls back to a template and says so. GitHub sign-in creates a repository and pushes the project files. It is not a full git working tree inside the editor.

## Features

### Account

- Create an account with your name, email, and password.
- Log in, sign out, and continue as a guest. A guest keeps a name and is not a permanent account.
- Request a password reset. Architect returns a private reset link for that email.
- Sessions are stored in Postgres.

### Studio

- Left menu for Agent Studio, projects, workspace views, usage, getting started, resources, lane, and framework.
- Top bar with the current project. The menu shows four projects, then scrolls, and keeps **+ Create new** in place.
- **+ Create new** opens the prompt. If a project is already open, Architect asks you to save or cancel first.
- Settings: Night theme (the default) or Bright, studio credits, My account, Help, and Sign out.
- A drawer menu on a narrow screen.
- Closable chat on the right while a project is open. Hide it with the minus control.

### Starting a project

- Prompt with example starters, a typing hint, and Enter to send. Shift+Enter adds a line.
- Attach a text, markdown, CSV, or JSON file as context.
- Voice input when the browser provides speech recognition.
- Studio agents you can turn on from the plus menu: Researcher, Writer, Reviewer, and Router.
- Connectors you can record with the prompt (Gmail, Slack, Notion, Calendar, HubSpot, GitHub, Sheets, Linear). These stay as choices on the project.
- Import an existing GitHub repository.
- Import a zip of source files.
- Blank canvas opens an empty **Flow** named Untitled. Build renames Untitled when it generates the app.
- Design systems: Quiet paper, Ink dashboard, Editorial, and Field notes.
- Prompt library, marketplace starters, “what should I build” ideas, how-it-works, docs, Lyzr University notes, and a Discord link.

### Lanes and frameworks

- Soft stays on the outcome: prompt, plan, flow, preview, and chat.
- Pro uses the same project and adds framework choice, files, activity, GitHub, and deploy.
- Frameworks for both lanes: Lyzr Agents and CrewAI.
- Extra Pro frameworks: LangGraph, AutoGen, OpenAI Agents, and Custom.

### Plan, flow, and agents

- A short plan before the first build.
- Flow canvas: drag steps, zoom, add a step, and connect by dragging a dot from one step to another.
- Click a step or a connection to edit it. Save or Enter keeps the change. Cancel or Escape throws it away. Shift+Enter adds a line in a description.
- **Build** follows that flow and opens the preview.
- Agent canvas: drag cards, zoom, and connect any agent to any other. Edit a card or a line in a popup with the same Save and Cancel behavior.
- Activity lists what each agent did.

### The working app

- Preview is a page you can use in the browser.
- Chat can change that preview. Soft replies talk about the app. If the model does not answer, a template still produces a usable preview and the chat says so.
- Knowledge holds notes the project should trust.
- Data holds records for that project.
- Files shows the generated source. Edit a file and save it.
- Usage counts projects, published apps, shared apps, and trace events.

### Projects, publish, and GitHub

- My projects lists everything you started. The pencil renames a project (Save, Cancel, or Enter). The trash deletes it after a confirmation.
- Share marks a project so it also appears under Shared. Unshare removes that mark. Published lists apps you have deployed.
- The project in the top bar is the one Export, GitHub, and Deploy use.
- Export downloads a zip of the source, `preview.html`, and a small metadata file.
- GitHub signs you in through a popup, creates a repository, and pushes the project files. Soft can publish without this step.
- Deploy publishes a public preview at `/a/…` for either lane. Soft ships the preview they already see. The page stays on the Architect host.

## Run it yourself

```bash
npm install
npm run dev
```

Open http://localhost:3000

Copy `.env.example` to `.env`. The live app uses Neon Postgres. Locally, `DATABASE_URL` can point at your own Postgres.

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-string"
OPENAI_API_KEY=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

GitHub sign-in needs both client id and secret. Register the callback that matches the site you are using:

- Local: `http://localhost:3000/api/github/callback`
- Live: `https://architect-2-kohl.vercel.app/api/github/callback`

Do not commit `.env`.

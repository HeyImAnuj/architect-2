# Architect 2.0

Architect 2.0 is a dual-lane studio for **agentic applications**. One project holds the plan, the flow, the agents, the preview, and the source. Soft is for people who want the app. Pro is for people who also want the files, the framework, and GitHub.

**Live app:** https://architect-2-kohl.vercel.app  
**GitHub:** https://github.com/HeyImAnuj/architect-2

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
5. Press **Build**. **Preview** shows the app. Hide the chat with the minus when you are finished.
6. Open **Projects → My projects** to rename (pencil) or delete (trash). Delete asks you to confirm.
7. The project menu in the top bar chooses which app **Export**, **GitHub**, and **Deploy** use. **+ Create new** returns to the prompt. If a project is open, Architect asks you to save it first.

### Pro lane (files and frameworks)

Start the same way, then switch **Lane** to Pro and pick a framework: LangGraph, AutoGen, OpenAI Agents, or Custom, in addition to Lyzr Agents and CrewAI. After the flow is built:

- **Agents** is a free canvas. Drag cards, zoom, and connect any agent to any other from the dots on the card. Click a card or a line to edit it in a popup.
- **Files** is the generated source. Edit a file and save it.
- **Activity** lists what each agent did.
- **GitHub** signs you in, creates a repository, and pushes the project.
- **Deploy** publishes a public preview at an Architect URL (`/a/…`).

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

Connectors such as Gmail and Slack on the home prompt are choices stored with the project. They are not live logins to those products. Studio credits are a local counter (12 per new project, add 10 from Settings). Generation uses OpenAI when `OPENAI_API_KEY` is set; if that call fails, Architect falls back to a template and says so.

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

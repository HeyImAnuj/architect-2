# Architect 2.0

Dual-lane vibe-coding platform for **agentic applications** — built as the Lyzr Technical Product Manager assignment.

Live product thesis: Soft lane for operators / non-technical builders, Pro lane for engineers — same project, same agent graph, switch anytime.

## Live demo

- **App:** https://architect-2-sand.vercel.app
- **GitHub:** https://github.com/HeyImAnuj/architect-2

## Product thesis

Today's [Architect](https://www.architect.new/) is excellent for non-technical builders. Competitors either hide code (Lovable, Bolt, Emergent) or assume an IDE (Cursor, Codex, Claude Code). Architect 2.0 bridges both:

| Audience | Job to be done | Lane |
| --- | --- | --- |
| Non-technical | Prompt → agentic app → share URL | Soft |
| Technical | Import repo, pick framework, edit source, GitHub, traces, deploy | Pro |

**Differentiation**
1. **Agent graph as source of truth** — not buried behind a chat box
2. **Dual Soft / Pro lane** — not a locked no-code wall, not IDE-only
3. **Framework freedom** — Lyzr, LangGraph, CrewAI, AutoGen, OpenAI Agents, BYO
4. **Import continuum** — prompt, GitHub, zip, blank canvas
5. **Build map** — Intent → Plan → Agents → UI → Self-heal → Ready
6. **First-principles atelier UX** — rail + stage + always-on preview (not a Lovable clone)

## Features covered

- Authentication (Google simulated + guest)
- Homepage / compose studio
- Chat window (Soft vs Pro copy)
- App preview (live iframe)
- Agent section (visual graph)
- UI getting built (phased build animation)
- GitHub integration (multi-step dummy OAuth)
- Deploying the app (env → region → ship)
- Knowledge attachments
- Observability / traces (Pro)
- Files / source browser (Pro)
- Framework picker
- Project persistence (localStorage via Zustand)

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Framer Motion
- Zustand (persisted)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Deploy to Vercel (or any Node host):

```bash
npm run build
npm start
```

Or connect this repo to Vercel and deploy from `main`.

## Reviewer path (2 minutes)

1. Landing → **Start building**
2. Continue with Google (or guest)
3. Soft mode → pick a starter prompt → Create
4. Watch Build map animate; open **Agents** and **Preview**
5. Toggle **Pro** → open **Files** and **Traces**
6. Connect GitHub → Deploy

## Assignment notes

Most flows are intentionally high-fidelity product demos (dummy backend). Auth + project state persist in the browser so the experience feels continuous without requiring API keys.

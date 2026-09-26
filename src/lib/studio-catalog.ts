export const DESK_TABS = [
  { id: "preview", label: "Preview" },
  { id: "plan", label: "Plan" },
  { id: "agents", label: "Agents" },
  { id: "knowledge", label: "Knowledge" },
  { id: "data", label: "Data" },
  { id: "files", label: "Files" },
  { id: "traces", label: "Activity" },
] as const;

export type DeskTab = (typeof DESK_TABS)[number]["id"];

export function isDeskTab(value: string | null): value is DeskTab {
  return DESK_TABS.some((tab) => tab.id === value);
}

export type StudioScreen =
  | "prompt"
  | "github"
  | "zip"
  | "blank"
  | "mine"
  | "published"
  | "shared"
  | "usage"
  | "how"
  | "library"
  | "marketplace"
  | "ideas"
  | "docs"
  | "design"
  | "discord"
  | "university"
  | "help"
  | "account";

export const CONNECTORS = [
  "Gmail",
  "Slack",
  "Notion",
  "Calendar",
  "HubSpot",
  "GitHub",
  "Sheets",
  "Linear",
];

export const STUDIO_AGENTS = [
  { id: "research", name: "Researcher", note: "Gathers sources and writes a brief." },
  { id: "writer", name: "Writer", note: "Drafts the user-facing reply or page." },
  { id: "reviewer", name: "Reviewer", note: "Checks claims, tone, and policy." },
  { id: "router", name: "Router", note: "Sends work to the right agent or a human." },
];

export const DESIGN_SYSTEMS = [
  {
    id: "quiet",
    name: "Quiet paper",
    note: "Light surfaces, serif headlines, and wide spacing for executive tools.",
  },
  {
    id: "ink",
    name: "Ink dashboard",
    note: "High-contrast panels for operators who live in dense data.",
  },
  {
    id: "editorial",
    name: "Editorial",
    note: "Magazine layout for briefs, research, and long-form answers.",
  },
  {
    id: "field",
    name: "Field notes",
    note: "Compact forms and status chips for support and ops teams.",
  },
];

export const PROMPT_LIBRARY = [
  {
    group: "Revenue",
    items: [
      {
        title: "SDR research desk",
        prompt:
          "Build an agentic SDR desk that researches accounts, drafts personalized outreach, and logs next steps for sales.",
      },
      {
        title: "Pipeline reviewer",
        prompt:
          "Build a pipeline reviewer that reads open deals, flags risk, and drafts a Monday brief for the sales lead.",
      },
    ],
  },
  {
    group: "Support",
    items: [
      {
        title: "Support triage",
        prompt:
          "Make a support triage app that classifies tickets, drafts replies, and routes critical issues to humans.",
      },
    ],
  },
  {
    group: "Operations",
    items: [
      {
        title: "Policy copilot",
        prompt:
          "Create an internal policy copilot that answers from uploaded PDFs, cites sources, and escalates uncertain answers.",
      },
    ],
  },
  {
    group: "Research",
    items: [
      {
        title: "Brief factory",
        prompt:
          "Build a research brief factory: one prompt in, multi-agent web research out, with charts and a shareable brief.",
      },
    ],
  },
  {
    group: "People",
    items: [
      {
        title: "Hiring screen",
        prompt:
          "Build a hiring screen that summarizes resumes against a role, scores must-have skills, and drafts a recruiter note.",
      },
    ],
  },
];

export const MARKETPLACE = [
  {
    id: "claim-desk",
    title: "Claim desk",
    category: "Finance",
    use: "Workflow automation",
    summary: "Reads expense claims, asks for missing receipts, and prepares an approval packet.",
    prompt:
      "Build a claim desk that reviews expense claims, requests missing receipts, and prepares an approval packet for finance.",
  },
  {
    id: "marketeam",
    title: "Campaign room",
    category: "Marketing",
    use: "Content creation",
    summary: "Turns a campaign brief into channel copy, a review pass, and a launch checklist.",
    prompt:
      "Build a campaign room that turns a brief into channel copy, a review pass, and a launch checklist.",
  },
  {
    id: "study-pilot",
    title: "Study pilot",
    category: "Research",
    use: "Data analysis",
    summary: "Plans an interview study, drafts the guide, and clusters the notes afterward.",
    prompt:
      "Build a study pilot that plans interviews, drafts the guide, and clusters notes into themes with quotes.",
  },
  {
    id: "care-router",
    title: "Care router",
    category: "Support",
    use: "Customer engagement",
    summary: "Classifies inbound requests and hands urgent ones to a person with context attached.",
    prompt:
      "Build a care router that classifies inbound requests and hands urgent ones to a person with the context attached.",
  },
];

export const IDEA_PROMPTS = [
  {
    role: "Executive",
    text: "Build a weekly operating brief that reads project updates and writes the three decisions I need to make.",
  },
  {
    role: "Operator",
    text: "Build an intake desk for internal requests that collects the missing fields and routes each one to the right owner.",
  },
  {
    role: "Engineer",
    text: "Build a repo companion that explains a service, proposes a patch, and opens the files an engineer would review.",
  },
];

export const HOW_STEPS = [
  ["Describe", "Write the outcome in Agent Studio, or start from the prompt library."],
  ["Ground it", "Attach a file, connect a tool, or bring agents you already use."],
  ["Shape it", "Pick a lane, a framework, and a design system before the build."],
  ["Plan", "Answer a few questions so the app matches how the team works."],
  ["Build", "Architect drafts the agents, the interface, and the source."],
  ["Ship", "Publish a link, export the code, or connect GitHub from the workspace."],
];

export const DOC_PAGES = [
  {
    title: "Planning",
    body: "A prompt starts in planning. Architect asks one question at a time, then writes a plan and an agent skill before generating the app.",
  },
  {
    title: "Agents and preview",
    body: "The workspace shows the agent graph next to a live preview. Soft lane edits the outcome in chat. Pro lane opens files, traces, and diffs.",
  },
  {
    title: "Knowledge and data",
    body: "Upload text the agents should trust. Records created during planning show up in the Data tab for that project.",
  },
  {
    title: "Publish",
    body: "Deploy writes a public preview link. Export downloads the project. Sharing a project lists it under Shared projects.",
  },
];

export const LESSONS = [
  {
    title: "Write an outcome, not a feature list",
    body: "Say who uses the app, what decision it should help them make, and what must never be invented. That gives the planner something to test against.",
  },
  {
    title: "Choose the lane on purpose",
    body: "Soft is for people who want to stay in language and the preview. Pro is the same project with files, frameworks, and GitHub when an engineer takes over.",
  },
  {
    title: "Attach the source of truth",
    body: "A policy PDF, a CSV, or a connector beats a longer prompt. The agents should cite what you attached instead of guessing.",
  },
  {
    title: "Publish only after a check",
    body: "Read the plan, run the preview, and look at traces before you share the link. A published app is the one people will actually open.",
  },
];

export const HELP_ITEMS = [
  {
    q: "Where do I start?",
    a: "Open Agent Studio, describe the app, and create the project. The planner asks a few questions before it builds.",
  },
  {
    q: "What is a credit?",
    a: "Studio credits are the allowance for this workspace. Each new project uses 12. You can add 10 from My account. They are not a payment balance.",
  },
  {
    q: "How do I share or publish?",
    a: "Share from My projects to list it under Shared. Deploy inside the workspace to list it under Published.",
  },
];

export const DISCORD_URL = "https://discord.com/invite/nm7zSyEFA2";

const STUDIO_SCREENS: StudioScreen[] = [
  "prompt",
  "github",
  "zip",
  "blank",
  "mine",
  "published",
  "shared",
  "usage",
  "how",
  "library",
  "marketplace",
  "ideas",
  "docs",
  "design",
  "discord",
  "university",
  "help",
  "account",
];

export function isStudioScreen(value: string | null): value is StudioScreen {
  return STUDIO_SCREENS.includes(value as StudioScreen);
}

export const SCREEN_LABELS: Record<StudioScreen, string> = {
  prompt: "Prompt",
  github: "Import GitHub",
  zip: "Import zip",
  blank: "Blank canvas",
  mine: "My projects",
  published: "Published",
  shared: "Shared",
  usage: "Usage",
  how: "How it works",
  library: "Prompt library",
  marketplace: "Marketplace",
  ideas: "What to build",
  docs: "Docs",
  design: "Design systems",
  discord: "Discord",
  university: "University",
  help: "Help",
  account: "Account",
};

export type CenterTab = DeskTab | StudioScreen;

export function isCenterTab(value: string | null): value is CenterTab {
  return isDeskTab(value) || isStudioScreen(value);
}

export function centerTabLabel(id: CenterTab) {
  if (isDeskTab(id)) return DESK_TABS.find((tab) => tab.id === id)?.label ?? id;
  return SCREEN_LABELS[id];
}

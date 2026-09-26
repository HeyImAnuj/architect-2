export type PlanQuestion = {
  id: string;
  title: string;
  why: string;
  type: "single" | "multi";
  options: { id: string; title: string; detail: string }[];
};

export const PLAN_QUESTIONS: PlanQuestion[] = [
  {
    id: "authority",
    title: "How much can this agent decide on its own?",
    why: "People stay in charge of sensitive actions.",
    type: "single",
    options: [
      { id: "advice", title: "Advice only", detail: "It recommends. A person still approves." },
      { id: "approval", title: "Act after approval", detail: "It prepares the work, then waits for a yes." },
      { id: "rules", title: "Act inside clear rules", detail: "It handles routine work and escalates anything sensitive." },
    ],
  },
  {
    id: "systems",
    title: "What should it look at?",
    why: "The agent is only as good as the evidence it can see.",
    type: "multi",
    options: [
      { id: "docs", title: "Company documents", detail: "Policies, handbooks, and uploaded files." },
      { id: "sheets", title: "Spreadsheets", detail: "Budgets, headcount, and trackers." },
      { id: "crm", title: "CRM", detail: "Customers, pipeline, and account notes." },
      { id: "chat", title: "Email and chat", detail: "Slack, Teams, or inbox context." },
    ],
  },
  {
    id: "memory",
    title: "Should the app remember things?",
    why: "This decides whether people can come back to past decisions.",
    type: "single",
    options: [
      { id: "yes", title: "Yes, keep a history", detail: "Accounts, decisions, and an audit trail." },
      { id: "no", title: "No, each session is temporary", detail: "Nothing is stored after the conversation." },
    ],
  },
  {
    id: "audience",
    title: "Who will use the finished app?",
    why: "The first screen should speak to them, not to a developer.",
    type: "single",
    options: [
      { id: "leaders", title: "Leaders", detail: "A clear view of decisions, risk, and what needs a yes." },
      { id: "team", title: "A team", detail: "Shared work for the people doing the day-to-day." },
      { id: "customers", title: "Customers", detail: "A simple experience for people outside the company." },
    ],
  },
];

export function buildPlanArtifacts(input: {
  name: string;
  prompt: string;
  answers: Record<string, string | string[]>;
}) {
  const authority = String(input.answers.authority || "approval");
  const systems = Array.isArray(input.answers.systems) ? input.answers.systems : [];
  const memory = String(input.answers.memory || "yes");
  const audience = String(input.answers.audience || "leaders");

  const plan = `# ${input.name}

${input.prompt}

## Who this is for
${audience === "leaders" ? "Leaders who need a short, trusted view." : audience === "customers" ? "Customers who should never see internal complexity." : "The team doing the work."}

## What the agent may do
${authority === "advice" ? "It advises only. A person makes the decision." : authority === "rules" ? "It can act when the request fits written rules, and must stop when it does not." : "It prepares a decision and waits for an authorized person to approve it."}

## Evidence it uses
${systems.length ? systems.map((s) => `- ${s}`).join("\n") : "- The description you provided"}

## Memory
${memory === "yes" ? "The app keeps decision history so people can review what happened." : "Nothing is stored between sessions."}

## Never do
- Invent policy.
- Hide why a recommendation was made.
- Take an action the chosen authority level does not allow.
`;

  const skill = `name: ${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "app"}
goal: Produce a clear, explainable result for the request.
always:
- Restate the request in plain language.
- Say which rule or source you used.
- Stop and ask a person when the request is outside the chosen authority.
never:
- Invent missing facts.
- Expose private records to the wrong audience.
`;

  return { plan, skill };
}

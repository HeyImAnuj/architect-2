"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GitBranch,
  Layers3,
  Rocket,
  Sparkles,
  SquareCode,
  Users,
} from "lucide-react";
import { useAppStore } from "@/lib/store";

const pillars = [
  {
    icon: Users,
    title: "Soft lane",
    text: "Describe the outcome. Shape the agents. Ship without opening the source.",
  },
  {
    icon: SquareCode,
    title: "Pro lane",
    text: "Files, diffs, frameworks, and GitHub when an engineer needs control.",
  },
  {
    icon: Layers3,
    title: "One graph",
    text: "The agent map stays in sync with the interface and the code.",
  },
];

const steps = ["Intent", "Plan", "Agents", "App", "Check", "Ship"];
const frame = "w-full px-5 sm:px-8 lg:px-12 xl:px-16";

function scrollToSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

export default function LandingPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const hydrated = useAppStore((s) => s.hydrated);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 1600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="blueprint-bg flex-1">
      <header className={`${frame} flex items-center justify-between gap-3 py-4 sm:py-5`}>
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-white">
            <Sparkles className="h-4 w-4 text-mint" />
          </div>
          <div className="min-w-0">
            <div className="display text-[1.35rem] leading-none text-paper">Architect</div>
            <div className="mono hidden text-[10px] uppercase tracking-[0.18em] text-muted sm:block">
              2.0 dual-lane
            </div>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <a
            href="#audience"
            className="hover:text-text"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("audience");
            }}
          >
            Who it&apos;s for
          </a>
          <a
            href="#flow"
            className="hover:text-text"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("flow");
            }}
          >
            Flow
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {hydrated && user ? (
            <Link href="/home" transitionTypes={["nav-forward"]} className="btn btn-primary px-3 sm:px-4">
              Open studio <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/auth" transitionTypes={["nav-forward"]} className="btn btn-ghost hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/auth" transitionTypes={["nav-forward"]} className="btn btn-primary px-3 sm:px-4">
                Start building
              </Link>
            </>
          )}
        </div>
      </header>

      <main>
        <section className={`${frame} grid items-center gap-8 pb-12 pt-6 sm:pb-16 sm:pt-10 lg:grid-cols-2 lg:gap-14 lg:pt-16`}>
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="chip chip-mint mb-4 sm:mb-5"
            >
              Built for people and engineers
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="display text-[clamp(3.1rem,7vw,6.5rem)] text-paper"
            >
              Architect
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:mt-5 sm:text-lg"
            >
              Describe an agentic app. Architect plans it, builds the interface, and keeps
              the source ready when a developer wants to take over.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap"
            >
              <button
                className="btn btn-primary w-full sm:w-auto"
                onClick={() =>
                  router.push(user ? "/home" : "/auth", { transitionTypes: ["nav-forward"] })
                }
              >
                Build an agentic app <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#flow"
                className="btn btn-ghost w-full sm:w-auto"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("flow");
                }}
              >
                See the flow
              </a>
            </motion.div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted sm:mt-8">
              <span className="chip">Prompt → agents → app</span>
              <span className="chip">Import GitHub</span>
              <span className="chip">Any framework</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="panel relative w-full overflow-hidden p-4 sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="mono truncate text-[11px] text-muted">atelier://workspace</span>
              <span className="chip chip-mint shrink-0">Soft ↔ Pro</span>
            </div>
            <div className="grid gap-3">
              <div className="rounded-xl border border-line bg-ink-2 p-3">
                <div className="mb-2 text-xs text-muted">Build map</div>
                <div className="grid grid-cols-6 gap-1">
                  {steps.map((step, index) => (
                    <div key={step} className="flex min-w-0 flex-col items-center gap-1">
                      <div
                        className={`h-1.5 w-full rounded-full transition-colors duration-500 ${
                          index <= activeStep ? "bg-mint" : "bg-line"
                        }`}
                      />
                      <span className="mono max-w-full truncate text-[9px] text-muted sm:text-[10px]">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
                <div className="rounded-xl border border-line bg-ink-2 p-3">
                  <div className="text-xs font-semibold text-mint">Soft</div>
                  <p className="mt-1 text-sm leading-snug text-paper">
                    Chat the outcome. Edit the agent graph. Watch the app appear.
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-ink-2 p-3">
                  <div className="text-xs font-semibold text-cyan">Pro</div>
                  <p className="mt-1 text-sm leading-snug text-paper">
                    Files, frameworks, GitHub, and traces when you need them.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-line bg-[linear-gradient(135deg,rgba(79,70,229,.08),transparent)] p-4">
                <div className="flex items-start gap-2 text-sm">
                  <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                  <span className="min-w-0 break-words">Connected · main ← architect/patch-ui</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                  <Rocket className="h-4 w-4 shrink-0 text-amber" />
                  Preview live · ready to publish
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="audience" className={`${frame} scroll-mt-8 py-10 sm:py-14`}>
          <h2 className="display text-[clamp(2rem,5vw,3.25rem)] text-paper">
            One place, two ways to work
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            Operators stay in plain language. Engineers can open the same project and
            change the source without starting over.
          </p>
          <div className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-3">
            {pillars.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.06 }}
                className="panel p-5"
              >
                <item.icon className="h-5 w-5 text-mint" />
                <h3 className="mt-3 text-lg font-semibold text-paper">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="flow" className={`${frame} scroll-mt-8 py-10 pb-16 sm:py-14 sm:pb-24`}>
          <h2 className="display text-[clamp(2rem,5vw,2.75rem)] text-paper">End-to-end flow</h2>
          <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "Sign in", "Create an account, or continue as a guest."],
              ["02", "Describe", "Prompt, import GitHub, or start from a blank canvas."],
              ["03", "Shape", "Answer a few questions, then watch the app take form."],
              ["04", "Ship", "Connect a repo, export the code, or publish a link."],
            ].map(([index, title, body]) => (
              <div key={title} className="panel p-5">
                <div className="mono text-xs text-mint">{index}</div>
                <h3 className="mt-2 font-semibold text-paper">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 sm:mt-10">
            <Link href="/auth" transitionTypes={["nav-forward"]} className="btn btn-primary w-full sm:w-auto">
              Enter Architect 2.0 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

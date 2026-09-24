"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Boxes,
  FolderTree,
  GitBranch,
  Library,
  MessageSquare,
  Rocket,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { WorkspacePanel } from "@/lib/types";
import { BuildTimeline } from "@/components/workspace/BuildTimeline";
import { ChatPanel } from "@/components/workspace/ChatPanel";
import { AgentGraph } from "@/components/workspace/AgentGraph";
import { PreviewPanel } from "@/components/workspace/PreviewPanel";
import { FilesPanel } from "@/components/workspace/FilesPanel";
import { KnowledgePanel } from "@/components/workspace/KnowledgePanel";
import { TracesPanel } from "@/components/workspace/TracesPanel";
import { GitHubModal } from "@/components/workspace/GitHubModal";
import { DeployModal } from "@/components/workspace/DeployModal";
import { uid } from "@/lib/utils";

const NAV: { id: WorkspacePanel; label: string; icon: typeof MessageSquare; pro?: boolean }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "agents", label: "Agents", icon: Boxes },
  { id: "files", label: "Files", icon: FolderTree, pro: true },
  { id: "knowledge", label: "Knowledge", icon: Library },
  { id: "traces", label: "Traces", icon: Activity, pro: true },
];

export default function WorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const user = useAppStore((s) => s.user);
  const project = useAppStore((s) => s.projects.find((p) => p.id === params.id));
  const buildingProjectId = useAppStore((s) => s.buildingProjectId);
  const activePanel = useAppStore((s) => s.activePanel);
  const setPanel = useAppStore((s) => s.setPanel);
  const setMode = useAppStore((s) => s.setMode);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const connectGithub = useAppStore((s) => s.connectGithub);
  const deployProject = useAppStore((s) => s.deployProject);
  const updateProject = useAppStore((s) => s.updateProject);

  const [githubOpen, setGithubOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [stage, setStage] = useState<"work" | "preview">("work");

  useEffect(() => {
    if (hydrated && !user) router.replace("/auth");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (hydrated && user && !project) router.replace("/home");
  }, [hydrated, user, project, router]);

  const building = buildingProjectId === project?.id;
  const nav = useMemo(
    () => NAV.filter((n) => project?.mode === "pro" || !n.pro),
    [project?.mode],
  );

  if (!hydrated || !user || !project) {
    return <div className="blueprint-bg min-h-screen" />;
  }

  return (
    <div className="blueprint-bg flex h-screen flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-ink/80 px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/home" className="btn btn-ghost px-2 py-2">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-panel-2">
            <Sparkles className="h-3.5 w-3.5 text-mint" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-paper">{project.name}</div>
            <div className="mono truncate text-[10px] text-muted">
              {project.framework} · {project.phase}
            </div>
          </div>
        </div>

        <div className="hidden flex-1 justify-center px-4 lg:flex">
          <div className="w-full max-w-xl">
            <BuildTimeline phase={project.phase} building={building} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-line bg-ink-2 p-1">
            {(["soft", "pro"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(project.id, m);
                  if (m === "soft" && (activePanel === "files" || activePanel === "traces")) {
                    setPanel("chat");
                  }
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${
                  project.mode === m ? "bg-mint text-[#042f2e]" : "text-muted"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost hidden sm:inline-flex" onClick={() => setGithubOpen(true)}>
            <GitBranch className="h-4 w-4" />
            {project.githubConnected ? "GitHub" : "Connect"}
          </button>
          <button className="btn btn-primary" onClick={() => setDeployOpen(true)}>
            <Rocket className="h-4 w-4" />
            Deploy
          </button>
        </div>
      </header>

      <div className="border-b border-line px-4 py-2 lg:hidden">
        <BuildTimeline phase={project.phase} building={building} />
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-16 flex-col items-center gap-2 border-r border-line bg-ink-2/80 py-3 md:w-44 md:items-stretch md:px-2">
          {nav.map((item) => {
            const active = activePanel === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPanel(item.id);
                  setStage("work");
                }}
                className={`flex items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold md:justify-start md:px-3 ${
                  active
                    ? "bg-mint/15 text-mint"
                    : "text-muted hover:bg-panel-2 hover:text-text"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
          <button
            className={`mt-auto flex items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold md:justify-start md:px-3 ${
              stage === "preview"
                ? "bg-cyan/15 text-cyan"
                : "text-muted hover:bg-panel-2 hover:text-text"
            }`}
            onClick={() => setStage("preview")}
          >
            <span className="hidden md:inline">Focus preview</span>
            <span className="md:hidden">UI</span>
          </button>
        </aside>

        <div className="grid min-h-0 min-w-0 flex-1 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="min-h-0 border-r border-line bg-panel/40">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel + project.mode}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                {activePanel === "chat" && (
                  <ChatPanel
                    messages={project.messages}
                    mode={project.mode}
                    onSend={(c) => sendMessage(project.id, c)}
                  />
                )}
                {activePanel === "agents" && (
                  <AgentGraph
                    agents={project.agents}
                    edges={project.edges}
                    building={building}
                  />
                )}
                {activePanel === "files" && <FilesPanel files={project.files} />}
                {activePanel === "knowledge" && (
                  <KnowledgePanel
                    files={project.knowledgeFiles}
                    onAdd={() =>
                      updateProject(project.id, {
                        knowledgeFiles: [
                          ...project.knowledgeFiles,
                          `note-${uid("doc").slice(-4)}.md`,
                        ],
                      })
                    }
                  />
                )}
                {activePanel === "traces" && <TracesPanel />}
              </motion.div>
            </AnimatePresence>
          </section>

          <section
            className={`min-h-0 bg-ink/50 ${
              stage === "preview" ? "fixed inset-0 z-40 lg:static" : "hidden lg:block"
            }`}
          >
            {stage === "preview" && (
              <div className="flex items-center justify-between border-b border-line bg-ink px-4 py-2 lg:hidden">
                <span className="text-sm font-semibold">Preview</span>
                <button className="btn btn-ghost" onClick={() => setStage("work")}>
                  Close
                </button>
              </div>
            )}
            <PreviewPanel html={project.previewHtml} phase={project.phase} />
          </section>
        </div>
      </div>

      <GitHubModal
        open={githubOpen}
        onClose={() => setGithubOpen(false)}
        connected={project.githubConnected}
        repo={project.githubRepo}
        onConnect={(repo) => connectGithub(project.id, repo)}
      />
      <DeployModal
        open={deployOpen}
        onClose={() => setDeployOpen(false)}
        deployed={project.deployed}
        url={project.deployUrl}
        onDeploy={() => deployProject(project.id)}
      />
    </div>
  );
}

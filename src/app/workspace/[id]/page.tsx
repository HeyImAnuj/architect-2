"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { StudioChrome } from "@/components/studio/StudioSidebar";
import { ChatPanel } from "@/components/workspace/ChatPanel";
import { AgentGraph } from "@/components/workspace/AgentGraph";
import { PreviewPanel } from "@/components/workspace/PreviewPanel";
import { FilesPanel } from "@/components/workspace/FilesPanel";
import { KnowledgePanel } from "@/components/workspace/KnowledgePanel";
import { TracesPanel } from "@/components/workspace/TracesPanel";
import { PlanFlow } from "@/components/workspace/PlanFlow";
import { DataPanel } from "@/components/workspace/DataPanel";
import { GitHubModal } from "@/components/workspace/GitHubModal";
import { DeployModal } from "@/components/workspace/DeployModal";
import { clientApi } from "@/lib/client-api";
import { isCenterTab, isStudioScreen, type CenterTab } from "@/lib/studio-catalog";
import { CenterTabs } from "@/components/studio/CenterTabs";
import { StudioPanels } from "@/components/studio/StudioPanels";
import { useStudioComposer } from "@/components/studio/useStudioComposer";

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100dvh-2.75rem)] items-center justify-center text-sm text-muted">
          Opening atelier…
        </div>
      }
    >
      <WorkspaceScreen />
    </Suspense>
  );
}

function WorkspaceScreen() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const user = useAppStore((s) => s.user);
  const project = useAppStore((s) => s.projects.find((p) => p.id === params.id));
  const buildingProjectId = useAppStore((s) => s.buildingProjectId);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const connectGithub = useAppStore((s) => s.connectGithub);
  const importRepo = useAppStore((s) => s.importRepo);
  const deployProject = useAppStore((s) => s.deployProject);
  const updateProject = useAppStore((s) => s.updateProject);
  const addKnowledge = useAppStore((s) => s.addKnowledge);
  const updateFile = useAppStore((s) => s.updateFile);

  const [githubOpen, setGithubOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [loadingMissing, setLoadingMissing] = useState(false);
  const [openTabs, setOpenTabs] = useState<CenterTab[]>([]);
  const [activeTab, setActiveTab] = useState<CenterTab | null>(null);
  const lastQuery = useRef("");
  const panelRequest = useAppStore((s) => s.panelRequest);
  const workspaceAction = useAppStore((s) => s.workspaceAction);
  const seenRequest = useRef(panelRequest?.nonce ?? 0);
  const seenAction = useRef(workspaceAction?.nonce ?? 0);

  useEffect(() => {
    if (hydrated && !user) router.replace("/auth", { transitionTypes: ["nav-forward"] });
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!hydrated || !user || project || !params.id) return;
    setLoadingMissing(true);
    clientApi
      .getProject(params.id)
      .then(({ project: p }) => {
        useAppStore.setState((s) => ({
          projects: [p, ...s.projects.filter((x) => x.id !== p.id)],
        }));
      })
      .catch(() => router.replace("/home", { transitionTypes: ["nav-back"] }))
      .finally(() => setLoadingMissing(false));
  }, [hydrated, user, project, params.id, router]);

  function openTab(id: CenterTab) {
    setOpenTabs((current) => (current.includes(id) ? current : [...current, id]));
    setActiveTab(id);
  }

  function closeTab(id: CenterTab) {
    const next = openTabs.filter((tab) => tab !== id);
    const nextActive = activeTab === id ? (next[next.length - 1] ?? null) : activeTab;
    setOpenTabs(next);
    setActiveTab(nextActive);
  }

  const composer = useStudioComposer(openTab);

  useEffect(() => {
    if (!project) return;
    const query = `${project.id}|${searchParams.toString()}`;
    if (query === lastQuery.current) return;
    const switchingProject = !lastQuery.current.startsWith(`${project.id}|`);
    lastQuery.current = query;
    const requested = searchParams.get("tab");
    const action = searchParams.get("action");
    if (action === "deploy") setDeployOpen(true);
    if (action === "github") setGithubOpen(true);
    if (switchingProject) {
      const progress: CenterTab = project.phase === "planning" ? "plan" : "preview";
      const tabs: CenterTab[] = [progress];
      if (isCenterTab(requested) && requested !== progress) tabs.push(requested);
      setOpenTabs(tabs);
      setActiveTab(isCenterTab(requested) ? requested : progress);
      return;
    }
    if (isCenterTab(requested)) openTab(requested);
  }, [project, searchParams]);

  useEffect(() => {
    if (!panelRequest || panelRequest.nonce === seenRequest.current) return;
    seenRequest.current = panelRequest.nonce;
    if (!isCenterTab(panelRequest.id)) return;
    openTab(panelRequest.id);
  }, [panelRequest]);

  useEffect(() => {
    if (!workspaceAction || workspaceAction.nonce === seenAction.current) return;
    seenAction.current = workspaceAction.nonce;
    if (workspaceAction.type === "github") setGithubOpen(true);
    if (workspaceAction.type === "deploy") setDeployOpen(true);
  }, [workspaceAction]);

  useEffect(() => {
    if (activeTab && isStudioScreen(activeTab)) composer.noteScreen(activeTab);
  }, [activeTab, composer.noteScreen]);

  if (!hydrated || !user || !project) {
    return (
      <StudioChrome>
        <div className="flex flex-1 items-center justify-center text-sm text-muted">
          {loadingMissing ? "Loading project…" : "Opening atelier…"}
        </div>
      </StudioChrome>
    );
  }

  const building = buildingProjectId === project.id;

  return (
    <StudioChrome>
      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col bg-[#f7f8f9]">
          {openTabs.length > 0 && (
            <CenterTabs tabs={openTabs} active={activeTab} onFocus={openTab} onClose={closeTab} />
          )}

          <div
            className={`min-h-0 flex-1 ${
              activeTab && isStudioScreen(activeTab)
                ? "overflow-y-auto bg-[#f7f8f9] px-6 py-8"
                : "overflow-hidden bg-white"
            }`}
          >
            {!activeTab && (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                Open a view from the menu. This project stays open in its own tab.
              </div>
            )}
            {activeTab && isStudioScreen(activeTab) && composer.user && (
              <StudioPanels
                screen={activeTab}
                prompt={composer.prompt}
                setPrompt={composer.setPrompt}
                mode={composer.mode}
                framework={composer.framework}
                githubRepo={composer.githubRepo}
                setGithubRepo={composer.setGithubRepo}
                zipName={composer.zipName}
                onZip={composer.readZip}
                creating={composer.creating}
                error={composer.error}
                onCreate={() => void composer.handleCreate()}
                projects={composer.projects}
                onShare={(item) =>
                  void composer.updateProject(item.id, {
                    visibility: item.visibility === "shared" ? "private" : "shared",
                  })
                }
                designId={composer.designId}
                setDesignId={composer.setDesignId}
                connectors={composer.connectors}
                toggleConnector={(name) =>
                  composer.setConnectors((current) =>
                    current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
                  )
                }
                agentIds={composer.agentIds}
                toggleAgent={(id) =>
                  composer.setAgentIds((current) =>
                    current.includes(id) ? current.filter((idItem) => idItem !== id) : [...current, id],
                  )
                }
                attachmentName={composer.attachmentName}
                onAttach={(file) => {
                  composer.setAttachmentName(file.name);
                  void file.text().then((text) => composer.setAttachment(text.slice(0, 4000)));
                }}
                listening={composer.listening}
                onVoice={composer.toggleVoice}
                onUsePrompt={(next) => {
                  composer.setPrompt(next);
                  openTab("prompt");
                }}
                credits={composer.credits}
                onGrantCredits={() => composer.saveCredits(composer.credits + 10)}
                userName={composer.user.name}
                userEmail={composer.user.email}
              />
            )}
            {activeTab === "preview" && (
              <PreviewPanel html={project.previewHtml} phase={project.phase} />
            )}
            {activeTab === "plan" && project.phase === "planning" && (
              <PlanFlow projectId={project.id} prompt={project.prompt} onBuilt={() => openTab("preview")} />
            )}
            {activeTab === "plan" && project.phase !== "planning" && (
              <div className="h-full overflow-auto p-6">
                <h2 className="text-lg font-semibold text-paper">Plan</h2>
                <pre className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {project.planMarkdown || "The plan appears after you answer the setup questions."}
                </pre>
                {project.skillMarkdown && (
                  <>
                    <h3 className="mt-6 text-sm font-semibold text-paper">Agent rules</h3>
                    <pre className="mt-2 whitespace-pre-wrap text-sm text-muted">{project.skillMarkdown}</pre>
                  </>
                )}
              </div>
            )}
            {activeTab === "agents" && (
              <AgentGraph
                agents={project.agents}
                edges={project.edges}
                building={building}
                onChange={(agents) => void updateProject(project.id, { agents })}
              />
            )}
            {activeTab === "files" && (
              <FilesPanel
                files={project.files}
                onSave={(path, content) => updateFile(project.id, path, content)}
              />
            )}
            {activeTab === "knowledge" && (
              <KnowledgePanel
                files={project.knowledgeFiles}
                onAdd={(file) => addKnowledge(project.id, file)}
              />
            )}
            {activeTab === "data" && <DataPanel projectId={project.id} />}
            {activeTab === "traces" && <TracesPanel traces={project.traces || []} />}
          </div>
        </section>

        <aside className="flex w-[360px] shrink-0 flex-col border-l border-[#eceef2] bg-white max-lg:w-[300px]">
          <ChatPanel
            messages={project.messages}
            mode={project.mode}
            onSend={(content) => void sendMessage(project.id, content)}
          />
        </aside>
      </div>

      <GitHubModal
        open={githubOpen}
        onClose={() => setGithubOpen(false)}
        connected={project.githubConnected}
        repo={project.githubRepo}
        onConnect={async (repo) => connectGithub(project.id, repo)}
        onImport={async (repo) => {
          await importRepo(project.id, repo);
          setGithubOpen(false);
        }}
      />
      <DeployModal
        open={deployOpen}
        onClose={() => setDeployOpen(false)}
        deployed={project.deployed}
        url={project.deployUrl}
        githubRepo={project.githubRepo}
        onDeploy={async (meta) => deployProject(project.id, meta)}
      />
    </StudioChrome>
  );
}

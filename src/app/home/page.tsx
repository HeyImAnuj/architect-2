"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { isStudioScreen, type StudioScreen } from "@/lib/studio-catalog";
import { StudioPanels } from "@/components/studio/StudioPanels";
import { StudioChrome } from "@/components/studio/StudioSidebar";
import { CenterTabs } from "@/components/studio/CenterTabs";
import { useStudioComposer } from "@/components/studio/useStudioComposer";

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function HomePage() {
  return (
    <Suspense fallback={<div className="blueprint-bg flex-1" />}>
      <HomeScreen />
    </Suspense>
  );
}

function HomeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useAppStore((s) => s.hydrated);
  const refreshProjects = useAppStore((s) => s.refreshProjects);
  const panelRequest = useAppStore((s) => s.panelRequest);
  const seenRequest = useRef(panelRequest?.nonce ?? 0);
  const [openTabs, setOpenTabs] = useState<StudioScreen[]>(["prompt"]);
  const [screen, setScreen] = useState<StudioScreen>("prompt");

  function openTab(id: StudioScreen) {
    setOpenTabs((current) => (current.includes(id) ? current : [...current, id]));
    setScreen(id);
  }

  function closeTab(id: StudioScreen) {
    const next = openTabs.filter((tab) => tab !== id);
    const fallback = next[next.length - 1] ?? "prompt";
    setOpenTabs(next.length ? next : ["prompt"]);
    if (screen === id) setScreen(next.length ? fallback : "prompt");
  }

  const composer = useStudioComposer(openTab);

  useEffect(() => {
    if (hydrated && !composer.user) router.replace("/auth", { transitionTypes: ["nav-forward"] });
    if (hydrated && composer.user) void refreshProjects();
  }, [hydrated, composer.user, router, refreshProjects]);

  useEffect(() => {
    composer.noteScreen(screen);
  }, [screen, composer.noteScreen]);

  useEffect(() => {
    const view = searchParams.get("view");
    if (!isStudioScreen(view)) return;
    openTab(view);
  }, [searchParams]);

  useEffect(() => {
    if (!panelRequest || panelRequest.nonce === seenRequest.current) return;
    seenRequest.current = panelRequest.nonce;
    if (!isStudioScreen(panelRequest.id)) return;
    openTab(panelRequest.id);
  }, [panelRequest]);

  if (!hydrated || !composer.user) {
    return <div className="blueprint-bg flex-1" />;
  }

  const user = composer.user;

  return (
    <StudioChrome>
      <section className="flex min-h-0 flex-1 flex-col bg-[#f7f8f9]">
        <CenterTabs tabs={openTabs} active={screen} onFocus={openTab} onClose={closeTab} />
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.34, ease: easeOut }}
            >
              <StudioPanels
                screen={screen}
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
                onShare={(project) =>
                  void composer.updateProject(project.id, {
                    visibility: project.visibility === "shared" ? "private" : "shared",
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
                    current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
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
                userName={user.name}
                userEmail={user.email}
              />
            </motion.div>
          </AnimatePresence>
        </main>
      </section>
    </StudioChrome>
  );
}

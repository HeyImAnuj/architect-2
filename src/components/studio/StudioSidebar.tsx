"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Boxes,
  ChevronRight,
  Download,
  FolderGit2,
  GitBranch,
  Layers3,
  Library,
  LogOut,
  Rocket,
  Settings,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { FRAMEWORKS } from "@/lib/utils";
import {
  DESK_TABS,
  type DeskTab,
  type StudioScreen,
} from "@/lib/studio-catalog";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function StudioSidebar({
  showClose = false,
  onClose,
}: {
  showClose?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const desk = searchParams.get("tab");
  const user = useAppStore((s) => s.user);
  const projects = useAppStore((s) => s.projects);
  const setMode = useAppStore((s) => s.setMode);
  const composeMode = useAppStore((s) => s.composeMode);
  const composeFramework = useAppStore((s) => s.composeFramework);
  const setComposeMode = useAppStore((s) => s.setComposeMode);
  const setComposeFramework = useAppStore((s) => s.setComposeFramework);
  const requestPanel = useAppStore((s) => s.requestPanel);
  const [openMenu, setOpenMenu] = useState<string | null>("studio");

  const workspaceId = pathname.match(/^\/workspace\/([^/]+)/)?.[1];
  const selectedId = workspaceId ? desk : view;
  const selected = (id: string) => selectedId === id || (!workspaceId && !view && id === "prompt");
  const project = projects.find((item) => item.id === workspaceId) ?? projects[0];
  const mode = project && workspaceId ? project.mode : composeMode;
  const frameworkId = project && workspaceId ? project.framework : composeFramework;
  const frameworks = useMemo(
    () => FRAMEWORKS.filter((item) => mode === "pro" || item.audience === "both"),
    [mode],
  );

  function go(view: StudioScreen) {
    onClose?.();
    requestPanel(view);
    if (workspaceId) {
      router.push(`/workspace/${workspaceId}?tab=${view}`, { transitionTypes: ["nav-forward"] });
      return;
    }
    router.push(`/home?view=${view}`, { transitionTypes: ["nav-forward"] });
  }

  function openDesk(tab: DeskTab | "deploy" | "github") {
    onClose?.();
    const id = workspaceId || projects[0]?.id;
    if (!id) {
      requestPanel("prompt");
      router.push("/home?view=prompt");
      return;
    }
    if (tab === "deploy" || tab === "github") {
      router.push(`/workspace/${id}?action=${tab}`, { transitionTypes: ["nav-forward"] });
      return;
    }
    requestPanel(tab);
    router.push(`/workspace/${id}?tab=${tab}`, { transitionTypes: ["nav-forward"] });
  }

  function chooseMode(next: "soft" | "pro") {
    setComposeMode(next);
    if (workspaceId) void setMode(workspaceId, next);
  }

  if (!user) return null;

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-[#eceef2] bg-white">
      <div className="flex items-center gap-2 px-3 pb-3 pt-3">
        <button
          className="min-w-0 flex-1 truncate rounded-full border border-[#e6e8ee] px-3 py-1.5 text-left text-[13px] text-paper"
          onClick={() => go("account")}
        >
          {user.name}
        </button>
        {showClose && (
          <button aria-label="Close menu" onClick={onClose}>
            <X className="h-4 w-4 text-muted" />
          </button>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-3">
        <MenuGroup label="Agent Studio" icon={Sparkles} open={openMenu === "studio"} onToggle={() => setOpenMenu((c) => (c === "studio" ? null : "studio"))}>
          <SubItem label="Prompt" active={selected("prompt")} onClick={() => go("prompt")} />
          <SubItem label="Import GitHub" active={selected("github")} onClick={() => go("github")} />
          <SubItem label="Import zip" active={selected("zip")} onClick={() => go("zip")} />
          <SubItem label="Blank canvas" active={selected("blank")} onClick={() => go("blank")} />
        </MenuGroup>

        <MenuLabel>Projects</MenuLabel>
        <MenuGroup label="Projects" icon={FolderGit2} open={openMenu === "projects"} onToggle={() => setOpenMenu((c) => (c === "projects" ? null : "projects"))}>
          <SubItem label="My projects" active={selected("mine")} onClick={() => go("mine")} />
          <SubItem label="Published" active={selected("published")} onClick={() => go("published")} />
          <SubItem label="Shared" active={selected("shared")} onClick={() => go("shared")} />
        </MenuGroup>

        <MenuLabel>Workspace</MenuLabel>
        <MenuGroup label="Open a view" icon={Layers3} open={openMenu === "workspace"} onToggle={() => setOpenMenu((c) => (c === "workspace" ? null : "workspace"))}>
          {DESK_TABS.map((tab) => (
            <SubItem key={tab.id} label={tab.label} active={selected(tab.id)} onClick={() => openDesk(tab.id)} />
          ))}
          <SubItem label="GitHub" onClick={() => openDesk("github")} />
          <SubItem label="Deploy" onClick={() => openDesk("deploy")} />
          <SubItem
            label="Export"
            onClick={() => {
              const id = workspaceId || projects[0]?.id;
              if (!id) {
                router.push("/home?view=prompt");
                return;
              }
              window.location.assign(`/api/projects/${id}/export`);
            }}
          />
        </MenuGroup>

        <MenuLabel>Traceability</MenuLabel>
        <MenuGroup label="Traceability" icon={Zap} open={openMenu === "trace"} onToggle={() => setOpenMenu((c) => (c === "trace" ? null : "trace"))}>
          <SubItem label="Usage" active={selected("usage")} onClick={() => go("usage")} />
        </MenuGroup>

        <MenuLabel>Get started</MenuLabel>
        <MenuGroup label="Get started" icon={Library} open={openMenu === "start"} onToggle={() => setOpenMenu((c) => (c === "start" ? null : "start"))}>
          <SubItem label="How it works" active={selected("how")} onClick={() => go("how")} />
          <SubItem label="Prompt library" active={selected("library")} onClick={() => go("library")} />
          <SubItem label="Marketplace" active={selected("marketplace")} onClick={() => go("marketplace")} />
          <SubItem label="What should I build" active={selected("ideas")} onClick={() => go("ideas")} />
        </MenuGroup>

        <MenuLabel>Resources</MenuLabel>
        <MenuGroup label="Resources" icon={BookOpen} open={openMenu === "resources"} onToggle={() => setOpenMenu((c) => (c === "resources" ? null : "resources"))}>
          <SubItem label="Docs" active={selected("docs")} onClick={() => go("docs")} />
          <SubItem label="Design systems" active={selected("design")} onClick={() => go("design")} />
          <SubItem label="Discord" active={selected("discord")} onClick={() => go("discord")} />
          <SubItem label="Lyzr University" active={selected("university")} onClick={() => go("university")} />
        </MenuGroup>

        <MenuLabel>Build</MenuLabel>
        <MenuGroup label="Lane" icon={Layers3} open={openMenu === "lane"} onToggle={() => setOpenMenu((c) => (c === "lane" ? null : "lane"))}>
          <SubItem label="Soft" active={mode === "soft"} onClick={() => chooseMode("soft")} />
          <SubItem label="Pro" active={mode === "pro"} onClick={() => chooseMode("pro")} />
        </MenuGroup>
        <MenuGroup label="Framework" icon={Boxes} open={openMenu === "framework"} onToggle={() => setOpenMenu((c) => (c === "framework" ? null : "framework"))}>
          {frameworks.map((item) => (
            <SubItem
              key={item.id}
              label={item.label}
              active={frameworkId === item.id}
              onClick={() => {
                setComposeFramework(item.id);
                if (workspaceId) {
                  void useAppStore.getState().updateProject(workspaceId, { framework: item.id });
                }
              }}
            />
          ))}
        </MenuGroup>
      </nav>
    </aside>
  );
}

export function StudioChrome({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  return (
    <div className="flex h-[calc(100dvh-2.75rem)] flex-col overflow-hidden bg-[#f7f8f9]">
      <StudioTopBar onMenu={() => setDrawer(true)} />
      <div className="flex min-h-0 flex-1">
        <div className="hidden h-full md:block">
          <StudioSidebar />
        </div>
        <AnimatePresence>
          {drawer && (
            <motion.div className="fixed inset-0 z-40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button className="absolute inset-0 bg-[#12141a]/30" aria-label="Close menu" onClick={() => setDrawer(false)} />
              <motion.div
                className="absolute inset-y-0 left-0"
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ duration: 0.38, ease: easeOut }}
              >
                <StudioSidebar showClose onClose={() => setDrawer(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

function StudioTopBar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const projects = useAppStore((s) => s.projects);
  const user = useAppStore((s) => s.user);
  const signOut = useAppStore((s) => s.signOut);
  const requestPanel = useAppStore((s) => s.requestPanel);
  const requestWorkspaceAction = useAppStore((s) => s.requestWorkspaceAction);
  const workspaceId = pathname.match(/^\/workspace\/([^/]+)/)?.[1];
  const projectId = workspaceId || projects[0]?.id;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [credits, setCredits] = useState(200);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const key = `architect-credits-${user.id}`;
    const read = () => {
      const saved = window.localStorage.getItem(key);
      if (saved) setCredits(Number(saved) || 0);
    };
    read();
    window.addEventListener("architect-credits", read);
    return () => window.removeEventListener("architect-credits", read);
  }, [user]);

  useEffect(() => {
    if (!settingsOpen) return;
    function close(event: MouseEvent) {
      if (!settingsRef.current?.contains(event.target as Node)) setSettingsOpen(false);
    }
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [settingsOpen]);

  function openProjectAction(type: "github" | "deploy") {
    if (!projectId) {
      router.push("/home?view=prompt");
      return;
    }
    requestWorkspaceAction(type);
    if (!workspaceId) {
      router.push(`/workspace/${projectId}?action=${type}`, { transitionTypes: ["nav-forward"] });
    }
  }

  function openScreen(view: StudioScreen) {
    setSettingsOpen(false);
    requestPanel(view);
    if (workspaceId) {
      router.push(`/workspace/${workspaceId}?tab=${view}`, { transitionTypes: ["nav-forward"] });
      return;
    }
    router.push(`/home?view=${view}`, { transitionTypes: ["nav-forward"] });
  }

  function saveCredits(next: number) {
    if (!user) return;
    window.localStorage.setItem(`architect-credits-${user.id}`, String(next));
    setCredits(next);
    window.dispatchEvent(new Event("architect-credits"));
  }

  return (
    <header className="relative z-20 flex h-9 shrink-0 items-center border-b border-[#eceef2] bg-white px-2">
      <div className="flex min-w-0 items-center gap-2 pl-1.5">
        <button
          className="rounded-md px-2 py-1 text-[13px] font-medium text-[#3c4350] md:hidden"
          onClick={onMenu}
        >
          Menu
        </button>
        <span className="truncate text-[13px] font-medium tracking-tight text-paper">Lyzr AI</span>
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-[13px] font-semibold tracking-tight text-paper">Architect 2.0</span>
      </div>
      <div className="ml-auto flex items-center gap-0.5">
        {projectId ? (
          <a className="nav-row" href={`/api/projects/${projectId}/export`}>
            <Download className="h-3.5 w-3.5" />
            Export
          </a>
        ) : (
          <button className="nav-row" onClick={() => router.push("/home?view=prompt")}>
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        )}
        <button className="nav-row" onClick={() => openProjectAction("github")}>
          <GitBranch className="h-3.5 w-3.5" />
          GitHub
        </button>
        <button className="nav-row" onClick={() => openProjectAction("deploy")}>
          <Rocket className="h-3.5 w-3.5" />
          Deploy
        </button>
        <div className="relative" ref={settingsRef}>
          <button
            className={`nav-row ${settingsOpen ? "nav-row-active" : ""}`}
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
          {settingsOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-[#eceef2] bg-white p-1.5 shadow-lg">
              <button
                className="w-full rounded-full bg-[#e7f6ee] px-3 py-1.5 text-left text-[12px] font-medium text-[#157a45]"
                onClick={() => saveCredits(credits + 10)}
              >
                Add 10 credits
              </button>
              <button className="nav-row mt-1 w-full" onClick={() => openScreen("account")}>
                My account
                <span className="ml-auto text-[12px] text-muted">{credits}</span>
              </button>
              <button className="nav-row w-full" onClick={() => openScreen("help")}>
                Help and support
              </button>
              <button
                className="nav-row w-full"
                onClick={async () => {
                  setSettingsOpen(false);
                  await signOut();
                  router.push("/", { transitionTypes: ["nav-back"] });
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuLabel({ children }: { children: string }) {
  return (
    <div className="px-2 pb-1 pt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[#9aa3af]">
      {children}
    </div>
  );
}

function MenuGroup({
  label,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  label: string;
  icon: typeof Sparkles;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button className="nav-row w-full" aria-expanded={open} onClick={onToggle}>
        <Icon className="h-3.5 w-3.5 shrink-0 text-[#8b93a1]" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-[#8b93a1] transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
      </button>
      <Collapse open={open}>
        <div className="grid py-0.5 pl-6">{children}</div>
      </Collapse>
    </div>
  );
}

function SubItem({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`nav-row w-full ${active ? "nav-row-active" : ""}`}>
      {label}
    </button>
  );
}

function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const skip = useRef(true);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const next = open ? (innerRef.current?.scrollHeight ?? 0) : 0;
    setHeight(next);
    const frame = requestAnimationFrame(() => {
      skip.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [open, children]);

  return (
    <motion.div
      initial={false}
      animate={{ height, opacity: open ? 1 : 0 }}
      transition={{ duration: skip.current ? 0 : 0.42, ease: easeOut }}
      className="overflow-hidden"
    >
      <div ref={innerRef}>{children}</div>
    </motion.div>
  );
}

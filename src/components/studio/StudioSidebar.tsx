"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronRight,
  Download,
  FolderGit2,
  GitBranch,
  Layers3,
  Library,
  LogOut,
  Plus,
  Rocket,
  Sun,
  Moon,
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
import { applyTheme, readTheme, type ColorTheme } from "@/lib/theme";

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
    const id = workspaceId || useAppStore.getState().focusProjectId || (projects.length === 1 ? projects[0]?.id : "");
    if (!id) {
      requestPanel("mine");
      router.push("/home?view=mine");
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
      <div className="flex items-center justify-center gap-2 px-3 pb-3 pt-3">
        <button
          className="flex min-h-8 w-full items-center justify-center truncate rounded-full border border-[#e6e8ee] px-4 py-1.5 text-center text-[13px] font-medium text-paper"
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
              const id = workspaceId || useAppStore.getState().focusProjectId || (projects.length === 1 ? projects[0]?.id : "");
              if (!id) {
                router.push("/home?view=mine");
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
  const focusProjectId = useAppStore((s) => s.focusProjectId);
  const setFocusProject = useAppStore((s) => s.setFocusProject);
  const workspaceId = pathname.match(/^\/workspace\/([^/]+)/)?.[1];
  const projectId = workspaceId || focusProjectId || (projects.length === 1 ? projects[0]?.id : "");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [credits, setCredits] = useState(200);
  const [theme, setTheme] = useState<ColorTheme>("night");
  const settingsRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const currentProject = projects.find((item) => item.id === projectId);

  useEffect(() => {
    const read = () => setTheme(readTheme());
    read();
    window.addEventListener("architect-theme", read);
    return () => window.removeEventListener("architect-theme", read);
  }, []);

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
    if (!settingsOpen && !projectsOpen) return;
    function close(event: MouseEvent) {
      const target = event.target as Node;
      if (settingsOpen && !settingsRef.current?.contains(target)) setSettingsOpen(false);
      if (projectsOpen && !projectsRef.current?.contains(target)) setProjectsOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        setProjectsOpen(false);
      }
    }
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [settingsOpen, projectsOpen]);

  function openProjectAction(type: "github" | "deploy") {
    if (!projectId) {
      router.push("/home?view=mine");
      return;
    }
    requestWorkspaceAction(type);
    if (!workspaceId || workspaceId !== projectId) {
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

  function projectLabel(name: string, phase: string) {
    return phase === "intent" && name === "Blank Canvas" ? "Untitled" : name;
  }

  function askNewProject() {
    setProjectsOpen(false);
    if (workspaceId) {
      setLeaveOpen(true);
      return;
    }
    router.push("/home?view=prompt", { transitionTypes: ["nav-forward"] });
  }

  return (
    <>
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
        <div className="relative" ref={projectsRef}>
          <button
            className={`nav-row min-w-[9.5rem] max-w-[220px] ${projectsOpen ? "nav-row-active" : ""}`}
            aria-label="Current project"
            aria-expanded={projectsOpen}
            onClick={() => {
              setSettingsOpen(false);
              setProjectsOpen((open) => !open);
            }}
          >
            <span className="min-w-0 truncate">
              {currentProject
                ? projectLabel(currentProject.name, currentProject.phase)
                : projects.length
                  ? "Choose a project"
                  : "No project yet"}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out ${projectsOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {projectsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: easeOut }}
                className="absolute left-0 right-0 top-full z-50 mt-1 min-w-[9.5rem] overflow-hidden rounded-xl border border-[#eceef2] bg-white shadow-lg"
              >
                {projects.length > 0 && (
                  <div className="max-h-36 overflow-y-auto p-1">
                    {projects.map((item) => (
                      <button
                        key={item.id}
                        className={`flex h-9 w-full items-center truncate rounded-lg px-2.5 text-left text-[13px] text-paper hover:bg-panel-2 ${
                          item.id === projectId ? "bg-panel-2" : ""
                        }`}
                        title={projectLabel(item.name, item.phase)}
                        onClick={() => {
                          setFocusProject(item.id);
                          setProjectsOpen(false);
                          router.push(`/workspace/${item.id}`);
                        }}
                      >
                        {projectLabel(item.name, item.phase)}
                      </button>
                    ))}
                  </div>
                )}
                {projects.length === 0 && (
                  <p className="px-3 py-2 text-[12px] leading-5 text-muted">No project yet</p>
                )}
                <button
                  type="button"
                  className="flex h-9 w-full items-center gap-1 border-t border-[#eceef2] px-2.5 text-left text-[13px] font-medium text-paper hover:bg-panel-2"
                  onClick={askNewProject}
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  Create new
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
            onClick={() => {
              setProjectsOpen(false);
              setSettingsOpen((open) => !open);
            }}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
          <AnimatePresence>
          {settingsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: easeOut }}
              className="absolute right-0 top-full z-50 mt-1 max-h-80 w-56 overflow-y-auto rounded-xl border border-[#eceef2] bg-white p-1.5 shadow-lg"
            >
              <div className="grid grid-cols-2 gap-1 p-0.5">
                <button
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium ${
                    theme === "bright" ? "bg-panel-2 text-paper" : "text-muted hover:bg-panel-2"
                  }`}
                  onClick={() => applyTheme("bright")}
                >
                  <Sun className="h-3.5 w-3.5" />
                  Bright
                </button>
                <button
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium ${
                    theme === "night" ? "bg-panel-2 text-paper" : "text-muted hover:bg-panel-2"
                  }`}
                  onClick={() => applyTheme("night")}
                >
                  <Moon className="h-3.5 w-3.5" />
                  Night
                </button>
              </div>
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
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </header>
    {leaveOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="panel w-full max-w-sm p-4">
          <h3 className="text-sm font-semibold text-paper">Save this project?</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {currentProject ? projectLabel(currentProject.name, currentProject.phase) : "This project"} stays in your list. The prompt opens after you save, so you can name and describe the next app.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="h-8 rounded-md px-3 text-[13px] text-muted hover:bg-panel-2"
              onClick={() => setLeaveOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="h-8 rounded-md bg-mint px-3 text-[13px] font-medium text-white"
              onClick={() => {
                setLeaveOpen(false);
                router.push("/home?view=prompt", { transitionTypes: ["nav-forward"] });
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}
    </>
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
        <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-[#8b93a1] transition-transform duration-500 ease-out ${open ? "rotate-90" : ""}`} />
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

const MENU_LIMIT = 320;

function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;
    const measure = () => {
      const full = node.scrollHeight;
      setHeight(open ? Math.min(full, MENU_LIMIT) : 0);
      setCanScroll(open && full > MENU_LIMIT);
    };
    measure();
    if (!open) return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [open]);

  return (
    <motion.div
      initial={false}
      animate={{ height, opacity: open ? 1 : 0 }}
      transition={{ duration: 0.45, ease: easeOut }}
      className="overflow-hidden"
    >
      <div ref={innerRef} className={canScroll ? "max-h-80 overflow-y-auto" : undefined}>
        {children}
      </div>
    </motion.div>
  );
}

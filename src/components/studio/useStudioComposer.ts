"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { PROMPT_STARTERS } from "@/lib/mock";
import { DESIGN_SYSTEMS, STUDIO_AGENTS, type StudioScreen } from "@/lib/studio-catalog";

type ComposeTab = "prompt" | "github" | "zip" | "blank";

type SpeechHandle = {
  lang: string;
  start: () => void;
  onresult: (event: { results?: Array<Array<{ transcript: string }>> }) => void;
  onerror: () => void;
  onend: () => void;
};

export function useStudioComposer(onOpen: (screen: StudioScreen) => void) {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const projects = useAppStore((s) => s.projects);
  const createProject = useAppStore((s) => s.createProject);
  const updateProject = useAppStore((s) => s.updateProject);
  const mode = useAppStore((s) => s.composeMode);
  const framework = useAppStore((s) => s.composeFramework);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  const [tab, setTab] = useState<ComposeTab>("prompt");
  const [prompt, setPrompt] = useState("");
  const [githubRepo, setGithubRepo] = useState("acme/support-agents");
  const [zipBase64, setZipBase64] = useState("");
  const [zipName, setZipName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [designId, setDesignId] = useState("quiet");
  const [connectors, setConnectors] = useState<string[]>([]);
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const [attachment, setAttachment] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [listening, setListening] = useState(false);
  const [credits, setCredits] = useState(200);

  useEffect(() => {
    if (!user) return;
    const key = `architect-credits-${user.id}`;
    const saved = window.localStorage.getItem(key);
    if (saved) setCredits(Number(saved) || 0);
    else window.localStorage.setItem(key, "200");
  }, [user]);

  useEffect(() => {
    function syncCredits() {
      if (!user) return;
      const saved = window.localStorage.getItem(`architect-credits-${user.id}`);
      if (saved) setCredits(Number(saved) || 0);
    }
    window.addEventListener("architect-credits", syncCredits);
    return () => window.removeEventListener("architect-credits", syncCredits);
  }, [user]);

  const noteScreen = useCallback((screen: StudioScreen) => {
    if (screen === "prompt" || screen === "github" || screen === "zip" || screen === "blank") {
      setTab(screen);
    }
  }, []);

  function toggleVoice() {
    const Speech = (
      window as unknown as {
        SpeechRecognition?: new () => SpeechHandle;
        webkitSpeechRecognition?: new () => SpeechHandle;
      }
    ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => SpeechHandle;
        }
      ).webkitSpeechRecognition;
    if (!Speech) {
      setError("This browser does not expose speech recognition.");
      return;
    }
    const recognition = new Speech();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setPrompt((current) => (current ? `${current} ${transcript}` : transcript));
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    setError(null);
    recognition.start();
  }

  function saveCredits(next: number) {
    if (!user) return;
    window.localStorage.setItem(`architect-credits-${user.id}`, String(next));
    setCredits(next);
    window.dispatchEvent(new Event("architect-credits"));
  }

  function composePrompt(base: string) {
    const design = DESIGN_SYSTEMS.find((item) => item.id === designId);
    const agents = STUDIO_AGENTS.filter((item) => agentIds.includes(item.id));
    return [
      base,
      design ? `Design system: ${design.name}. ${design.note}` : "",
      connectors.length ? `Connect these tools: ${connectors.join(", ")}.` : "",
      agents.length ? `Include existing studio agents: ${agents.map((item) => item.name).join(", ")}.` : "",
      attachment ? `Attached context from ${attachmentName}:\n${attachment}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  async function handleCreate() {
    if (credits < 12) {
      setError("This account needs 12 credits to start a project.");
      onOpenRef.current("account");
      return;
    }
    if (tab === "zip" && !zipBase64) {
      setError("Choose a zip file before creating the project.");
      return;
    }
    setError(null);
    try {
      const source =
        tab === "github"
          ? "import-github"
          : tab === "zip"
            ? "import-zip"
            : tab === "blank"
              ? "blank"
              : "prompt";
      const id = await createProject({
        prompt: composePrompt(
          tab === "prompt"
            ? prompt || PROMPT_STARTERS[0].prompt
            : tab === "github"
              ? `Continue building imported repo ${githubRepo}`
              : tab === "zip"
                ? "Imported local project — map agents and keep iterating"
                : "Blank agentic canvas",
        ),
        framework,
        mode,
        source,
        connectors,
        githubRepo: tab === "github" ? githubRepo : undefined,
        zipBase64: tab === "zip" ? zipBase64 : undefined,
      });
      saveCredits(credits - 12);
      router.push(`/workspace/${id}`, { transitionTypes: ["nav-forward"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      setCreating(false);
    }
  }

  return {
    user,
    projects,
    updateProject,
    mode,
    framework,
    prompt,
    setPrompt,
    githubRepo,
    setGithubRepo,
    zipName,
    readZip: (file: File) => {
      setZipName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const value = String(reader.result || "");
        setZipBase64(value.includes(",") ? value.split(",")[1] : value);
      };
      reader.readAsDataURL(file);
    },
    creating,
    error,
    noteScreen,
    handleCreate,
    credits,
    saveCredits,
    designId,
    setDesignId,
    connectors,
    setConnectors,
    agentIds,
    setAgentIds,
    attachmentName,
    setAttachmentName,
    setAttachment,
    listening,
    toggleVoice,
  };
}

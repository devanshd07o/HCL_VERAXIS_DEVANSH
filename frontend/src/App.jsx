import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatStream from "./components/ChatStream";
import CommandBay from "./components/CommandBay";
import SettingsModal from "./components/SettingsModal";
import { Sparkles, ArrowRight, BookOpen, Compass } from "lucide-react";

const SESSIONS_KEY = "veraxis_sessions";

const CURATED_RESEARCH_PILLS = [
  {
    tag: "Energy",
    label: "Solid-State Batteries 2028",
    query: "Commercial viability of solid-state EV batteries by 2028 with ceramic electrolyte benchmarks",
  },
  {
    tag: "Genomics",
    label: "CRISPR-Cas9 In-Vivo Base Editing",
    query: "Clinical trial breakthroughs in CRISPR-Cas9 in vivo base editing for hematological disorders and viral vectors",
  },
  {
    tag: "Cryptography",
    label: "Post-Quantum Cryptography",
    query: "NIST Post-Quantum Cryptography standards: lattice-based Kyber and Dilithium implementation audits",
  },
  {
    tag: "Physics",
    label: "Commercial Fusion Q-Factor Scaling",
    query: "Commercial nuclear fusion net-energy Q-factor milestones: SPARC and ITER high-temperature superconductor magnets",
  },
];

export default function App() {
  // Theme state (dark by default)
  const [theme, setTheme] = useState(() => localStorage.getItem("veraxis-theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("veraxis-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Typography preferences
  const [fontFamily, setFontFamily] = useState(
    () => localStorage.getItem("veraxis-font-family") || "Plus Jakarta Sans"
  );
  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem("veraxis-font-size") || "15px"
  );

  const fontMap = {
    "Plus Jakarta Sans": "'Plus Jakarta Sans', sans-serif",
    Outfit: "'Outfit', sans-serif",
    Inter: "'Inter', sans-serif",
    "JetBrains Mono": "'JetBrains Mono', monospace",
  };

  useEffect(() => {
    document.documentElement.style.setProperty("--font-family", fontMap[fontFamily] || fontMap["Plus Jakarta Sans"]);
    document.documentElement.style.setProperty("--base-font-size", fontSize);
    localStorage.setItem("veraxis-font-family", fontFamily);
    localStorage.setItem("veraxis-font-size", fontSize);
  }, [fontFamily, fontSize]);

  // Layout width
  const [chatWidth, setChatWidth] = useState(
    () => localStorage.getItem("veraxis-chat-width") || "normal"
  );

  const widthClasses = {
    narrow: "max-w-[720px]",
    normal: "max-w-[880px]",
    wide: "max-w-[1080px]",
  };

  const activeWidthClass = widthClasses[chatWidth] || widthClasses.normal;

  useEffect(() => {
    localStorage.setItem("veraxis-chat-width", chatWidth);
  }, [chatWidth]);

  // Left Sidebar State: COLLAPSED BY DEFAULT AS REQUESTED
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatTitle, setChatTitle] = useState("New Chat");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [researchActive, setResearchActive] = useState(true);

  // Keyboard Shortcuts (Ctrl+B, Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleNewSession();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sessions state
  const [sessions, setSessions] = useState(() => {
    try {
      const stored = localStorage.getItem(SESSIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const stageRef = useRef(null);

  const saveSessionsToStorage = (updatedSessions) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
    } catch (e) {
      console.warn("Storage write failed:", e);
    }
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInputValue("");
    setChatTitle("New Chat");
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSelectSession = (id) => {
    const sess = sessions.find((s) => s.id === id);
    if (!sess) return;
    setCurrentSessionId(id);
    setChatTitle(sess.title || "New Chat");
    setMessages(sess.messages || []);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteSession = (id) => {
    const filtered = sessions.filter((s) => s.id !== id);
    saveSessionsToStorage(filtered);
    if (currentSessionId === id) {
      handleNewSession();
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.scrollTop = stageRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Main Send Directive Handler
  const handleSendQuery = async (queryText, forceResearchParam) => {
    const text = (queryText || inputValue).trim();
    if (!text || isLoading) return;

    const isResearchPriority =
      forceResearchParam !== undefined ? Boolean(forceResearchParam) : researchActive;

    setInputValue("");
    setIsLoading(true);

    const newMsg = { role: "user", content: text };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);

    // Auto title stage 1
    const words = text.split(/\s+/).filter(Boolean);
    let sessionTitle = chatTitle;
    if (messages.length === 0) {
      if (words.length >= 3) {
        sessionTitle = words
          .slice(0, 4)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        setChatTitle(sessionTitle);
      } else {
        sessionTitle = text;
        setChatTitle(sessionTitle);
      }
    }

    let activeId = currentSessionId;
    let updatedSessions = [...sessions];

    if (!activeId) {
      activeId = "sess-" + Date.now();
      setCurrentSessionId(activeId);
      updatedSessions.unshift({
        id: activeId,
        title: sessionTitle,
        createdAt: new Date().toISOString(),
        messages: updatedMessages,
      });
    } else {
      updatedSessions = updatedSessions.map((s) =>
        s.id === activeId ? { ...s, messages: updatedMessages, title: sessionTitle } : s
      );
    }
    saveSessionsToStorage(updatedSessions);

    try {
      // Step 1: Autonomous Intent Classification API Call
      let intent = "DEEP_RESEARCH";
      try {
        const classifyRes = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: text }),
        });
        if (classifyRes.ok) {
          const classifyData = await classifyRes.json();
          intent = classifyData.intent || "DEEP_RESEARCH";
        }
      } catch (classifyErr) {
        console.warn("Classification fallback:", classifyErr);
      }

      // Prioritize research if researchable, route casual queries to fast chat
      const isResearch = isResearchPriority
        ? intent === "DEEP_RESEARCH" || (intent !== "GENERAL_CHAT" && words.length > 2)
        : intent === "DEEP_RESEARCH";

      let enhancedQuery = text;
      let searchKeywords = "";

      // Step 2: Query Rephrasing API Call
      if (isResearch) {
        try {
          const rephraseRes = await fetch("/api/rephrase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: text }),
          });
          if (rephraseRes.ok) {
            const rephraseData = await rephraseRes.json();
            enhancedQuery = rephraseData.enhanced_query || text;
            searchKeywords = rephraseData.search_keywords || "";
          }
        } catch (rephraseErr) {
          console.warn("Rephrase fallback:", rephraseErr);
        }
      }

      // Step 3: Main Research / Chat API Call
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          mode: isResearch ? "deep" : "fast",
          enhanced_query: enhancedQuery,
          search_keywords: searchKeywords,
          force_research: isResearch,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();

      // Step 4: Output stored in buffer and revealed via typewriter stream
      const botMsg = {
        role: "bot",
        content: data.content,
        type: data.type || (isResearch ? "research" : "chat"),
        sources: data.sources || [],
        pdf_filename: data.pdf_filename || null,
        topic: data.topic || null,
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);

      // Auto title stage 2 after 4 messages
      let finalTitle = sessionTitle;
      if (finalMessages.length === 4) {
        try {
          const titleRes = await fetch("/api/title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: finalMessages }),
          });
          if (titleRes.ok) {
            const titleData = await titleRes.json();
            if (titleData.title && titleData.title !== "Research Inquiry") {
              finalTitle = titleData.title;
              setChatTitle(finalTitle);
            }
          }
        } catch (e) {
          console.warn("Auto-title summary failed:", e);
        }
      }

      updatedSessions = updatedSessions.map((s) =>
        s.id === activeId ? { ...s, messages: finalMessages, title: finalTitle } : s
      );
      saveSessionsToStorage(updatedSessions);
    } catch (err) {
      const errMsg = {
        role: "bot",
        content: `⚠️ Communication error: ${err.message}. Please retry with refined parameters.`,
        type: "error",
      };
      const finalMessages = [...updatedMessages, errMsg];
      setMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const isInitialMode = messages.length === 0;

  return (
    <div className="relative w-screen h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-200">
      {/* Top Header */}
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onOpenSettings={() => setSettingsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        chatTitle={chatTitle}
        isInitialMode={isInitialMode}
        onReturnHome={handleNewSession}
      />

      {/* Main Container */}
      <div className="relative flex-1 flex w-full min-h-0 overflow-hidden">
        {/* Mobile Backdrop when sidebar is open */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="sm:hidden fixed inset-0 z-25 bg-black/50 backdrop-blur-xs"
          />
        )}

        {/* Collapsible Left Sidebar */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewSession={handleNewSession}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onOpenSettings={() => setSettingsOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Center Main Stage */}
        <main
          className={`flex-1 h-full flex flex-col min-w-0 overflow-hidden transition-[padding] duration-200 ease-out ${
            sidebarOpen ? "sm:pl-[300px] md:pl-[330px]" : "sm:pl-[64px] pl-0"
          }`}
        >
          {isInitialMode ? (
            /* ============================================================ */
            /* PERPLEXITY-STYLE MINIMALIST HOMEPAGE HERO                    */
            /* ============================================================ */
            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 overflow-y-auto">
              <div className="w-full max-w-[780px] flex flex-col items-center text-center gap-6 animate-buttery-fade-in">
                {/* Clean Logo & Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>VERAXIS // MULTI-AGENT CREW CORE</span>
                </div>

                {/* Hero Headline */}
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
                    Where Empirical Research Begins
                  </h1>
                  <p className="text-[14px] sm:text-[15px] text-[var(--text-muted)] max-w-[560px] mx-auto font-normal leading-relaxed">
                    Ingests live arXiv preprints, cross-verifies empirical claims with confidence indices, and compiles publication dossiers.
                  </p>
                </div>

                {/* Centered Command Bar */}
                <div className="w-full pt-2">
                  <CommandBay
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSendQuery}
                    disabled={isLoading}
                    researchActive={researchActive}
                    setResearchActive={setResearchActive}
                    variant="workbench"
                    theme={theme}
                  />
                </div>

                {/* Curated Research Topics Pills */}
                <div className="w-full pt-3 flex flex-col items-center gap-2.5">
                  <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                    Suggested Research Directives
                  </span>

                  <div className="flex flex-wrap justify-center gap-2 max-w-[700px]">
                    {CURATED_RESEARCH_PILLS.map((pill, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInputValue(pill.query);
                          handleSendQuery(pill.query, true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-[12px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--accent-primary)]/40 hover:bg-[var(--highlight-bg)] active:scale-95 transition-all cursor-pointer shadow-xs"
                      >
                        <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] uppercase">
                          {pill.tag}
                        </span>
                        <span className="truncate max-w-[220px]">{pill.label}</span>
                        <ArrowRight className="w-3 h-3 opacity-60 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* ACTIVE RESEARCH CONVERSATION & FLOATING COMMAND DOCK         */
            /* ============================================================ */
            <div className="relative flex-1 h-full overflow-hidden">
              {/* Scrollable Chat Stream */}
              <div
                ref={stageRef}
                className="w-full h-full overflow-y-auto stage-scroll-container px-3 sm:px-6 pt-4 pb-32 sm:pb-36"
              >
                <ChatStream
                  messages={messages}
                  isLoading={isLoading}
                  widthClass={activeWidthClass}
                />
              </div>

              {/* Floating Bottom Command Dock */}
              <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none flex justify-center px-3 sm:px-6 pb-3 sm:pb-5 pt-8 bg-gradient-to-t from-[var(--bg-app)] via-[var(--bg-app)]/90 to-transparent">
                <div className={`w-full ${activeWidthClass} pointer-events-auto`}>
                  <CommandBay
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSendQuery}
                    disabled={isLoading}
                    researchActive={researchActive}
                    setResearchActive={setResearchActive}
                    variant="dock"
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontSize={fontSize}
        setFontSize={setFontSize}
        chatWidth={chatWidth}
        setChatWidth={setChatWidth}
      />
    </div>
  );
}

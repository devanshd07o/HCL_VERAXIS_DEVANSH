import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import RightInspector from "./components/RightInspector";
import HomepagePortal from "./components/HomepagePortal";
import ChatStream from "./components/ChatStream";
import CommandBay from "./components/CommandBay";
import SettingsModal from "./components/SettingsModal";
import NeuformCanvas from "./components/NeuformCanvas";

const SESSIONS_KEY = "veraxis_sessions";

export default function App() {
  // Theme state
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

  // Chat workspace width state (narrow, normal, wide)
  const [chatWidth, setChatWidth] = useState(
    () => localStorage.getItem("veraxis-chat-width") || "normal"
  );

  const widthClasses = {
    narrow: "max-w-[760px]",
    normal: "max-w-[940px]",
    wide: "max-w-[1180px]",
  };

  const activeWidthClass = widthClasses[chatWidth] || widthClasses.normal;

  useEffect(() => {
    localStorage.setItem("veraxis-chat-width", chatWidth);
  }, [chatWidth]);

  // Layout Panels state (Left & Right)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [activeResearchData, setActiveResearchData] = useState(null);
  const [chatTitle, setChatTitle] = useState("New Chat");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [executionMode, setExecutionMode] = useState("deep");

  // Dynamic AI Suggestions state (2 fresh topics)
  const [dynamicSuggestions, setDynamicSuggestions] = useState([
    {
      label: "Solid-State Batteries 2028",
      query: "Commercial viability of solid-state EV batteries by 2028 with ceramic electrolyte benchmarks",
    },
    {
      label: "CRISPR-Cas9 In-Vivo Editing",
      query: "Clinical trial breakthroughs in CRISPR-Cas9 in vivo base editing for hematological and oncological disorders",
    },
  ]);

  const fetchDynamicSuggestions = async () => {
    try {
      const res = await fetch("/api/suggestions");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDynamicSuggestions(data);
        }
      }
    } catch (e) {
      console.warn("Suggestions fetch failed:", e);
    }
  };

  useEffect(() => {
    fetchDynamicSuggestions();
  }, []);

  // Keyboard Shortcuts (Ctrl+B, Ctrl+I, Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setRightPanelOpen((prev) => !prev);
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
    setActiveResearchData(null);
    fetchDynamicSuggestions();
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSelectSession = (id) => {
    const sess = sessions.find((s) => s.id === id);
    if (!sess) return;
    setCurrentSessionId(id);
    setChatTitle(sess.title || "New Chat");
    const msgs = sess.messages || [];
    setMessages(msgs);
    // Find latest research message in this session to populate Inspector
    const latestResearch = [...msgs].reverse().find((m) => m.type === "research");
    if (latestResearch) {
      setActiveResearchData(latestResearch);
    } else {
      setActiveResearchData(null);
    }
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

  // Scroll to bottom when messages update
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.scrollTop = stageRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Send Query Handler with 2-Stage AI Title Renaming
  const handleSendQuery = async (queryText, modeOverride) => {
    const text = (queryText || inputValue).trim();
    if (!text || isLoading) return;

    const activeMode = modeOverride || executionMode;
    setInputValue("");
    setIsLoading(true);

    const newMsg = { role: "user", content: text };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);

    // Stage 1: Auto-title if first query has 3+ words
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

    // Persist session
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, mode: activeMode }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();

      const botMsg = {
        role: "bot",
        content: data.content,
        type: data.type || "chat",
        sources: data.sources || [],
        pdf_filename: data.pdf_filename || null,
        topic: data.topic || null,
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);

      // If deep research, wire data to Inspector and open on desktop
      if (botMsg.type === "research") {
        setActiveResearchData(botMsg);
        if (window.innerWidth >= 1024) {
          setRightPanelOpen(true);
        }
      }

      // Stage 2: When exactly 2 full convo rounds complete (2 user + 2 bot = 4 messages)
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
        content: `⚠️ Encountered communication issue: ${err.message}. Please retry with refined parameters.`,
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
    <div className="relative w-screen h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300">
      {/* Top Permanent Header Bar */}
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        rightPanelOpen={rightPanelOpen}
        setRightPanelOpen={setRightPanelOpen}
        onOpenSettings={() => setSettingsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        hasActiveResearch={Boolean(activeResearchData)}
        chatTitle={chatTitle}
        onDoubleClickHeader={() => setSidebarOpen((prev) => !prev)}
        isInitialMode={isInitialMode}
        onReturnHome={handleNewSession}
      />

      {/* App Stage & Shell with 3-Column Studio Grid */}
      <div className="relative flex-1 flex w-full min-h-0 overflow-hidden z-10">
        {isInitialMode && <NeuformCanvas theme={theme} />}

        {/* Mobile Backdrop Overlay when Left sidebar is open */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="sm:hidden fixed inset-0 z-25 bg-black/50 backdrop-blur-xs transition-opacity"
          />
        )}

        {/* Mobile Backdrop Overlay when Right inspector is open */}
        {rightPanelOpen && (
          <div
            onClick={() => setRightPanelOpen(false)}
            className="lg:hidden fixed inset-0 z-25 bg-black/50 backdrop-blur-xs transition-opacity"
          />
        )}

        {/* Left Collapsible Navigation Sidebar (Image 2 style floating island) */}
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

        {/* Center Main Stage (Adapts margins based on left/right panel states) */}
        <main
          onDoubleClick={(e) => {
            // If user double-clicks chat screen area when sidebar is open, close it
            if (sidebarOpen) {
              const isInteractive = e.target.closest("input, textarea, button, a");
              if (!isInteractive) {
                setSidebarOpen(false);
              }
            }
          }}
          className={`flex-1 h-full flex flex-col min-w-0 overflow-hidden transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            sidebarOpen ? "sm:pl-[300px] md:pl-[340px]" : "sm:pl-[70px] pl-0"
          } ${rightPanelOpen ? "xl:pr-[430px]" : "pr-0"}`}
        >
          {isInitialMode ? (
            /* MISSION CONTROL HOMEPAGE WORKBENCH */
            <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto stage-scroll-container">
              <HomepagePortal
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendQuery}
                disabled={isLoading}
                suggestions={dynamicSuggestions}
                mode={executionMode}
                setMode={setExecutionMode}
                theme={theme}
                onSelectTopic={(topicQuery) => {
                  setInputValue(topicQuery);
                  handleSendQuery(topicQuery, "deep");
                }}
              />
            </div>
          ) : (
            /* ACTIVE DOSSIER WORKSPACE & FLOATING WORKBENCH DOCK */
            <div className="relative flex-1 h-full overflow-hidden">
              {/* Scrollable Messages Stream */}
              <div
                ref={stageRef}
                className="w-full h-full overflow-y-auto stage-scroll-container px-2 sm:px-4 pt-4 pb-32 sm:pb-36"
              >
                <ChatStream
                  messages={messages}
                  isLoading={isLoading}
                  widthClass={activeWidthClass}
                  onInspectResearch={(data) => {
                    setActiveResearchData(data);
                    setRightPanelOpen(true);
                  }}
                />
              </div>

              {/* Floating Dock Command Bay */}
              <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none flex justify-center px-3 sm:px-6 pb-3 sm:pb-5 pt-8 bg-gradient-to-t from-[var(--bg-app)] via-[var(--bg-app)]/90 to-transparent">
                <div className={`w-full ${activeWidthClass} pointer-events-auto`}>
                  <CommandBay
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSendQuery}
                    disabled={isLoading}
                    mode={executionMode}
                    setMode={setExecutionMode}
                    variant="dock"
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Research Inspector Drawer (Zerneza Style) */}
        <RightInspector
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          researchData={activeResearchData}
          theme={theme}
        />
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

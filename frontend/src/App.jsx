import React, { useState, useEffect, useRef } from "react";
import NeuformCanvas from "./components/NeuformCanvas";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import HeroCenter from "./components/HeroCenter";
import ChatStream from "./components/ChatStream";
import LiquidGlassInput from "./components/LiquidGlassInput";
import SettingsModal from "./components/SettingsModal";

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

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    fetchDynamicSuggestions();
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSelectSession = (id) => {
    const sess = sessions.find((s) => s.id === id);
    if (!sess) return;
    setCurrentSessionId(id);
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

  // Scroll to bottom when messages update
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.scrollTop = stageRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Send Query Handler
  const handleSendQuery = async (queryText) => {
    const text = (queryText || inputValue).trim();
    if (!text || isLoading) return;

    setInputValue("");
    setIsLoading(true);

    const newMsg = { role: "user", content: text };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);

    // Persist session
    let activeId = currentSessionId;
    let updatedSessions = [...sessions];

    if (!activeId) {
      activeId = "sess-" + Date.now();
      setCurrentSessionId(activeId);
      const title = text.length > 30 ? text.substring(0, 30) + "..." : text;
      updatedSessions.unshift({
        id: activeId,
        title,
        createdAt: new Date().toISOString(),
        messages: updatedMessages,
      });
    } else {
      updatedSessions = updatedSessions.map((s) =>
        s.id === activeId ? { ...s, messages: updatedMessages } : s
      );
    }
    saveSessionsToStorage(updatedSessions);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
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

      updatedSessions = updatedSessions.map((s) =>
        s.id === activeId ? { ...s, messages: finalMessages } : s
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
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300">
      {/* Background Neuform Particle Simulation */}
      <NeuformCanvas theme={theme} />

      {/* Top Permanent Header Bar */}
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onOpenSettings={() => setSettingsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* App Stage & Shell */}
      <div className="relative flex-1 flex w-full h-[calc(100vh-56px)] pt-14 overflow-hidden z-10">
        {/* Mobile Backdrop Overlay when sidebar is open */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="sm:hidden fixed inset-0 z-25 bg-black/50 backdrop-blur-xs transition-opacity"
          />
        )}

        {/* Collapsible Sidebar */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewSession={handleNewSession}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
        />

        {/* Main Stage with non-overlapping flex column */}
        <main
          className={`flex-1 h-full flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${
            sidebarOpen ? "sm:pl-64" : "pl-0"
          }`}
        >
          {isInitialMode ? (
            /* CENTERED LANDING HERO STATE */
            <div className="flex-1 flex items-center justify-center p-3 sm:p-4 overflow-y-auto stage-scroll-container">
              <HeroCenter
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendQuery}
                disabled={isLoading}
                suggestions={dynamicSuggestions}
                widthClass={activeWidthClass}
              />
            </div>
          ) : (
            /* ACTIVE CHAT WORKSPACE & FLOATING LIQUID GLASS DOCK (TEXT STREAMS BEHIND IT) */
            <div className="relative flex-1 h-full overflow-hidden">
              {/* Scrollable Messages Stream (Extends under the dock with pb-28 bottom clearance) */}
              <div
                ref={stageRef}
                className="w-full h-full overflow-y-auto stage-scroll-container px-2 sm:px-4 pt-4 pb-28 sm:pb-32"
              >
                <ChatStream
                  messages={messages}
                  isLoading={isLoading}
                  widthClass={activeWidthClass}
                />
              </div>

              {/* Floating Liquid Glass Dock (Pointer-events transparent wrapper) */}
              <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none flex justify-center px-3 sm:px-6 pb-safe pt-6 bg-gradient-to-t from-[var(--bg-app)]/40 to-transparent">
                <div className={`w-full ${activeWidthClass} pointer-events-auto`}>
                  <LiquidGlassInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSendQuery}
                    disabled={isLoading}
                    widthClass="w-full"
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

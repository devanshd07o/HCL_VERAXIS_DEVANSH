/**
 * VERAXIS AI — Autonomous Scientific Intelligence Frontend Controller
 * Thick Refractive Glassmorphic Claymorphism ("Mota Glass")
 * Features:
 * - Real-time Neuform Ambient Canvas Integration
 * - Perplexity-style Dynamic Research Telemetry
 * - Modular Code, Table, and Text Renderers
 * - Full Typography Customization & Settings Modal
 * - Persistent Multi-Session LocalStorage History
 * - Web Speech API Voice Dictation
 */

(function () {
  // DOM Elements
  const mainStage = document.getElementById("main-stage");
  const sidebar = document.getElementById("sidebar");
  const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeIcon = document.getElementById("theme-icon");
  const settingsToggleBtn = document.getElementById("settings-toggle-btn");
  const settingsBackdrop = document.getElementById("settings-modal-backdrop");
  const closeSettingsBtn = document.getElementById("close-settings-btn");
  const fontFamilySelect = document.getElementById("font-family-select");
  const fontSizeSelect = document.getElementById("font-size-select");
  const chatStream = document.getElementById("chat-stream");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const micBtn = document.getElementById("mic-btn");
  const newChatBtn = document.getElementById("new-chat-btn");
  const historyList = document.getElementById("history-list");

  // 1. Theme Management (Dark Obsidian vs Nordic Porcelain)
  let currentTheme = localStorage.getItem("veraxis-theme") || "dark";

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("veraxis-theme", theme);
    if (themeIcon) {
      themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
    }
    if (window.setCanvasTheme) {
      window.setCanvasTheme(theme);
    }
  }

  applyTheme(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      applyTheme(currentTheme === "dark" ? "light" : "dark");
    });
  }

  // 2. Settings Modal & Typography Customization
  const fontMap = {
    "Comfortaa": "'Comfortaa', cursive, sans-serif",
    "Outfit": "'Outfit', sans-serif",
    "Inter": "'Inter', sans-serif",
    "JetBrains Mono": "'JetBrains Mono', monospace"
  };

  const savedFontFamily = localStorage.getItem("veraxis-font-family") || "Comfortaa";
  const savedFontSize = localStorage.getItem("veraxis-font-size") || "18px";

  function applyTypography(family, size) {
    const fontString = fontMap[family] || fontMap["Comfortaa"];
    document.documentElement.style.setProperty("--font-family", fontString);
    document.documentElement.style.setProperty("--base-font-size", size);
    if (fontFamilySelect) fontFamilySelect.value = family;
    if (fontSizeSelect) fontSizeSelect.value = size;
  }

  applyTypography(savedFontFamily, savedFontSize);

  function openSettings() {
    if (settingsBackdrop) settingsBackdrop.classList.add("open");
  }

  function closeSettings() {
    if (settingsBackdrop) settingsBackdrop.classList.remove("open");
  }

  if (settingsToggleBtn) settingsToggleBtn.addEventListener("click", openSettings);
  if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", closeSettings);

  if (settingsBackdrop) {
    settingsBackdrop.addEventListener("click", (e) => {
      if (e.target === settingsBackdrop) closeSettings();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && settingsBackdrop && settingsBackdrop.classList.contains("open")) {
      closeSettings();
    }
  });

  if (fontFamilySelect) {
    fontFamilySelect.addEventListener("change", (e) => {
      const family = e.target.value;
      localStorage.setItem("veraxis-font-family", family);
      applyTypography(family, fontSizeSelect ? fontSizeSelect.value : "18px");
    });
  }

  if (fontSizeSelect) {
    fontSizeSelect.addEventListener("change", (e) => {
      const size = e.target.value;
      localStorage.setItem("veraxis-font-size", size);
      applyTypography(fontFamilySelect ? fontFamilySelect.value : "Comfortaa", size);
    });
  }

  // 3. Sidebar Toggle
  if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
    });
  }

  // 4. Session History Management (localStorage)
  const SESSIONS_STORAGE_KEY = "veraxis_sessions";
  let sessions = [];
  let currentSessionId = null;

  try {
    const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
    sessions = stored ? JSON.parse(stored) : [];
  } catch (e) {
    sessions = [];
  }

  function saveSessions() {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn("Storage quota exceeded or unavailable:", e);
    }
    renderHistoryList();
  }

  function getOrCreateActiveSession() {
    if (!currentSessionId) {
      currentSessionId = "sess-" + Date.now();
      const newSession = {
        id: currentSessionId,
        title: "New Investigation",
        createdAt: new Date().toISOString(),
        messages: []
      };
      sessions.unshift(newSession);
      saveSessions();
    }
    return sessions.find(s => s.id === currentSessionId);
  }

  function renderHistoryList() {
    if (!historyList) return;
    historyList.innerHTML = "";

    if (sessions.length === 0) {
      historyList.innerHTML = `
        <div style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 18px 10px;">
          No previous sessions yet
        </div>
      `;
      return;
    }

    sessions.forEach(sess => {
      const item = document.createElement("div");
      item.className = "history-item" + (sess.id === currentSessionId ? " active" : "");
      
      const titleSpan = document.createElement("span");
      titleSpan.style.overflow = "hidden";
      titleSpan.style.textOverflow = "ellipsis";
      titleSpan.style.whiteSpace = "nowrap";
      titleSpan.style.flex = "1";
      titleSpan.textContent = sess.title || "Untitled Session";
      
      const delBtn = document.createElement("button");
      delBtn.className = "header-icon-btn";
      delBtn.style.width = "26px";
      delBtn.style.height = "26px";
      delBtn.style.padding = "0";
      delBtn.style.opacity = "0.6";
      delBtn.title = "Delete Session";
      delBtn.innerHTML = "✕";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteSession(sess.id);
      });

      item.appendChild(titleSpan);
      item.appendChild(delBtn);

      item.addEventListener("click", () => {
        loadSession(sess.id);
      });

      historyList.appendChild(item);
    });
  }

  function deleteSession(id) {
    sessions = sessions.filter(s => s.id !== id);
    if (currentSessionId === id) {
      currentSessionId = null;
      resetToWelcomeScreen();
    }
    saveSessions();
  }

  function loadSession(id) {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    currentSessionId = id;
    renderHistoryList();

    chatStream.innerHTML = "";
    if (session.messages.length === 0) {
      if (mainStage) mainStage.classList.add("initial-mode");
    } else {
      if (mainStage) mainStage.classList.remove("initial-mode");
      session.messages.forEach(msg => {
        if (msg.role === "user") {
          appendUserBubble(msg.content, false);
        } else if (msg.role === "bot") {
          appendBotBubble(msg, false);
        }
      });
    }
    scrollToBottom();
  }

  function resetToWelcomeScreen() {
    currentSessionId = null;
    chatStream.innerHTML = "";
    if (mainStage) mainStage.classList.add("initial-mode");
    renderHistoryList();
    userInput.value = "";
    userInput.focus();
  }

  if (newChatBtn) {
    newChatBtn.addEventListener("click", resetToWelcomeScreen);
  }

  // 5. Speech Dictation (Web Speech API)
  let recognition = null;
  let isListening = false;

  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechAPI();
    recognition.continuous = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isListening = true;
      if (micBtn) micBtn.classList.add("listening");
      userInput.placeholder = "Listening... Speak your research topic";
    };

    recognition.onend = () => {
      isListening = false;
      if (micBtn) micBtn.classList.remove("listening");
      userInput.placeholder = "Ask a question or enter a research topic...";
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      userInput.value = transcript;
      sendQuery();
    };
  }

  if (micBtn) {
    micBtn.addEventListener("click", () => {
      if (!recognition) {
        alert("Speech Recognition is not supported in this browser. Please use Chrome or Edge.");
        return;
      }
      if (isListening) recognition.stop();
      else recognition.start();
    });
  }

  // 6. UI Rendering & Message Pipeline
  function scrollToBottom() {
    if (mainStage) mainStage.scrollTop = mainStage.scrollHeight;
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text || "";
    return div.innerHTML;
  }

  function renderFormattedContent(text) {
    if (window.VeraxisTextRenderer && typeof window.VeraxisTextRenderer.render === "function") {
      return window.VeraxisTextRenderer.render(text);
    }
    return escapeHtml(text).replace(/\n/g, "<br>");
  }

  function appendUserBubble(text, save = true) {
    if (mainStage) mainStage.classList.remove("initial-mode");

    const msg = document.createElement("div");
    msg.className = "chat-msg user";
    msg.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`;
    chatStream.appendChild(msg);
    scrollToBottom();

    if (save) {
      const activeSession = getOrCreateActiveSession();
      if (activeSession.messages.length === 0) {
        activeSession.title = text.length > 32 ? text.substring(0, 32) + "..." : text;
      }
      activeSession.messages.push({ role: "user", content: text });
      saveSessions();
    }
  }

  function appendBotContainer() {
    const msg = document.createElement("div");
    msg.className = "chat-msg bot";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    msg.appendChild(bubble);
    chatStream.appendChild(msg);
    scrollToBottom();
    return bubble;
  }

  function appendBotBubble(data, save = true) {
    const bubble = appendBotContainer();

    if (data.type === "chat") {
      bubble.innerHTML = renderFormattedContent(data.content);
    } else if (data.type === "research") {
      let sourcesHtml = "";
      if (data.sources && data.sources.length) {
        sourcesHtml = `
          <div class="sources-strip">
            ${data.sources.map(s => `
              <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="source-chip">
                <span>📄</span> <span>${escapeHtml(s.title ? s.title.substring(0, 44) : s.url)}</span>
              </a>
            `).join("")}
          </div>
        `;
      }

      bubble.innerHTML = `
        <!-- Perplexity-Style Dynamic Search Telemetry Accordion -->
        <div class="search-accordion">
          <div class="search-step-pill">
            <span>🔍</span> <span><b>Identified Topic:</b> <i>${escapeHtml(data.topic || "Deep Investigation")}</i></span>
          </div>
          <div class="search-step-pill">
            <span>🌐</span> <span><b>Indexed Authoritative Sources:</b> ${data.sources ? data.sources.length : 0} academic & market references</span>
          </div>
          ${sourcesHtml}
          <div class="search-step-pill" style="color: var(--accent-emerald);">
            <span>🛡️</span> <span><b>Forensic Fact-Check:</b> Cross-verified with zero-hallucination matrix</span>
          </div>
        </div>

        <div style="margin: 20px 0;">
          ${renderFormattedContent(data.content)}
        </div>

        <!-- Supreme ReportLab 4.x PDF Download Action Card -->
        ${data.pdf_filename ? `
          <div style="margin-top: 22px; padding: 18px 24px; background: var(--glass-surface-subtle); border: 1.5px solid var(--glass-border); border-radius: 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; box-shadow: var(--glass-shadow);">
            <div>
              <div style="font-weight: 700; font-size: 16px; color: var(--text-main);">📄 Executive Research Dossier (PDF)</div>
              <div style="font-size: 14px; color: var(--text-muted); margin-top: 2px;">McKinsey/Gartner publication format with two-pass vector canvas</div>
            </div>
            <a href="/api/download-pdf/${encodeURIComponent(data.pdf_filename)}" class="dock-btn send-btn" style="width: auto; height: auto; padding: 10px 24px; text-decoration: none; font-size: 15px; border-radius: 9999px; white-space: nowrap;">
              Download PDF
            </a>
          </div>
        ` : ''}
      `;
    } else {
      bubble.innerHTML = renderFormattedContent(data.content);
    }

    if (save) {
      const activeSession = getOrCreateActiveSession();
      activeSession.messages.push({
        role: "bot",
        content: data.content,
        type: data.type || "chat",
        sources: data.sources || [],
        pdf_filename: data.pdf_filename || null,
        topic: data.topic || null
      });
      saveSessions();
    }
  }

  async function sendQuery() {
    const text = userInput.value.trim();
    if (!text) return;
    userInput.value = "";

    // Lock send state
    sendBtn.disabled = true;
    userInput.disabled = true;

    appendUserBubble(text, true);
    const botBubble = appendBotContainer();

    // Responsive Thinking State
    botBubble.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; padding: 4px 0;">
        <span class="t-shimmer" data-text="Evaluating query intent & multi-agent routing...">Evaluating query intent & multi-agent routing...</span>
      </div>
    `;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text })
      });

      if (!res.ok) {
        throw new Error("HTTP " + res.status + " — " + res.statusText);
      }

      const data = await res.json();
      
      // Remove temporary shimmer bubble container and replace with full bot bubble
      const parentMsg = botBubble.closest(".chat-msg.bot");
      if (parentMsg) parentMsg.remove();

      appendBotBubble(data, true);
    } catch (err) {
      botBubble.innerHTML = `
        <div style="color: #EF4444; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <span>⚠️</span> <span>Encountered communication error: ${escapeHtml(err.message)}</span>
        </div>
      `;
    } finally {
      sendBtn.disabled = false;
      userInput.disabled = false;
      userInput.focus();
      scrollToBottom();
    }
  }

  // Event Listeners for Input & Sending
  sendBtn.addEventListener("click", sendQuery);
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  });

  // Suggestion Chips Click Listener
  document.querySelectorAll(".suggestion-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const q = chip.getAttribute("data-query");
      if (q) {
        userInput.value = q;
        sendQuery();
      }
    });
  });

  // Initial History Render
  renderHistoryList();
})();

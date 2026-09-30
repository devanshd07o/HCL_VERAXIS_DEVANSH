import React, { useRef, useState, useEffect } from "react";
import { Mic, ArrowUp, Sparkles, Loader2, Zap, Compass, Check } from "lucide-react";
import HoverPill from "./HoverPill";

const TYPEWRITER_PHRASES = [
  "Investigate solid-state battery ceramic electrolyte benchmarks...",
  "Evaluate CRISPR-Cas9 in vivo base editing clinical trial breakthroughs...",
  "Analyze NIST Post-Quantum lattice cryptography vulnerabilities...",
  "Audit commercial nuclear fusion net-energy Q-factor milestones...",
  "Cross-verify room-temperature superconductor replication trials...",
  "Assess neuromorphic photonic tensor processors vs GPU clusters...",
  "Explore high-density brain-computer interface decoding bandwidth...",
];

export default function CommandBay({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
  mode = "deep",
  setMode,
  variant = "workbench", // "workbench" | "dock"
  theme = "dark",
}) {
  const [isListening, setIsListening] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Typewriter effect when value is empty and not listening
  useEffect(() => {
    if (value || isListening) return;

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId = null;

    function tick() {
      const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];

      if (isDeleting) {
        setTypewriterText(currentPhrase.substring(0, charIndex - 1));
        charIndex--;
      } else {
        setTypewriterText(currentPhrase.substring(0, charIndex + 1));
        charIndex++;
      }

      let speed = isDeleting ? 25 : 50;

      if (!isDeleting && charIndex === currentPhrase.length) {
        speed = 2200;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % TYPEWRITER_PHRASES.length;
        speed = 400;
      }

      timeoutId = setTimeout(tick, speed);
    }

    timeoutId = setTimeout(tick, 300);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [value, isListening]);

  // Web Speech API
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechAPI();
      rec.continuous = false;
      rec.lang = "en-US";

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onChange(transcript);
          onSend(transcript, mode);
        }
      };
      recognitionRef.current = rec;
    }
  }, [onChange, onSend, mode]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleEnhance = async () => {
    if (!value.trim() || isEnhancing || disabled) return;
    setIsEnhancing(true);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: value }),
      });
      if (res.ok) {
        const data = await res.json();
        const enhanced = data.enhanced_query || value;
        onChange(enhanced);
        onSend(enhanced, mode);
      } else {
        onSend(value, mode);
      }
    } catch (err) {
      console.warn("Enhance failed, executing default send:", err);
      onSend(value, mode);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend(value, mode);
    }
  };

  const activePlaceholder = isListening
    ? "Acoustic sensor active... Speak research query"
    : placeholder || typewriterText || "Enter scientific research directive or technical query...";

  const isWorkbench = variant === "workbench";

  return (
    <div
      className={`w-full transition-all duration-200 ${
        isWorkbench
          ? "rounded-2xl p-3 sm:p-4 bg-[var(--input-dock-bg)] border border-[var(--input-border)] shadow-[var(--input-shadow)]"
          : "rounded-xl p-2 sm:p-2.5 bg-[var(--input-dock-bg)] border border-[var(--input-border)] shadow-[var(--input-shadow)]"
      }`}
    >
      {/* Top Console Bar: Execution Mode Selector & Status */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-white/[0.06] select-none text-[12px]">
        {/* Dual Mode Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-app)] border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setMode?.("deep")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition-all cursor-pointer ${
              mode === "deep"
                ? "bg-[var(--island-bg)] text-[var(--accent-primary)] shadow-xs border border-[var(--accent-primary)]/30"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Deep Empirical Swarm</span>
            <span className="hidden sm:inline text-[10px] font-mono opacity-70">~12s</span>
          </button>

          <button
            type="button"
            onClick={() => setMode?.("fast")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition-all cursor-pointer ${
              mode === "fast"
                ? "bg-[var(--island-bg)] text-[var(--accent-primary)] shadow-xs border border-[var(--accent-primary)]/30"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Fast Synthesis</span>
            <span className="hidden sm:inline text-[10px] font-mono opacity-70">&lt;400ms</span>
          </button>
        </div>

        {/* Engine Beacon Indicator */}
        <div className="hidden xs:flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>41 Groq LPU Keys Active</span>
        </div>
      </div>

      {/* Input Field & Action Cluster */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isEnhancing}
          placeholder={activePlaceholder}
          className="flex-1 py-1.5 px-2 bg-transparent border-none outline-none text-[var(--text-main)] text-[14.5px] sm:text-[15.5px] font-normal placeholder:text-[var(--text-muted)] placeholder:opacity-60 truncate"
          autoComplete="off"
          style={{ caretColor: "var(--accent-primary)" }}
        />

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Enhance Directive Button */}
          <HoverPill text="Enhance Query into Structured Academic Directive">
            <button
              type="button"
              onClick={handleEnhance}
              disabled={disabled || isEnhancing || !value.trim()}
              className="h-8.5 px-2.5 rounded-lg flex items-center gap-1.5 text-[11.5px] font-semibold bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isEnhancing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isEnhancing ? "Refining..." : "Enhance"}
              </span>
            </button>
          </HoverPill>

          {/* Voice Dictation (Mic) Button */}
          <HoverPill text={isListening ? "Stop Voice Dictation" : "Voice Dictation"}>
            <button
              type="button"
              onClick={toggleMic}
              disabled={disabled || isEnhancing}
              className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse"
                  : "bg-[var(--island-bg)] border border-white/[0.08] text-[var(--text-main)] hover:border-white/[0.18] active:scale-95"
              }`}
            >
              <Mic className="w-3.5 h-3.5 opacity-85" />
            </button>
          </HoverPill>

          {/* Execute Directive Button */}
          <HoverPill text="Execute Directive (Enter)">
            <button
              type="button"
              onClick={() => onSend(value, mode)}
              disabled={disabled || !value.trim() || isEnhancing}
              className="w-8.5 h-8.5 rounded-lg flex items-center justify-center bg-[var(--accent-primary)] text-white hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-bold shadow-xs"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </HoverPill>
        </div>
      </div>
    </div>
  );
}

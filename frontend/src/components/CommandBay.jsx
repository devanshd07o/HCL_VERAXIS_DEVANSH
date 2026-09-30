import React, { useRef, useState, useEffect } from "react";
import { Mic, ArrowUp, Sparkles, Loader2, Zap, Compass, Check, Terminal, Radio } from "lucide-react";
import HoverPill from "./HoverPill";

const TYPEWRITER_PHRASES = [
  "Investigate solid-state battery ceramic electrolyte conductivity & dendrite mitigation...",
  "Evaluate CRISPR-Cas9 in vivo base editing clinical breakthroughs & viral vector safety...",
  "Analyze NIST Post-Quantum lattice cryptography standards against Shor's algorithm...",
  "Audit commercial nuclear fusion net-energy Q-factor milestones in SPARC tokamaks...",
  "Cross-verify room-temperature hydride superconductor replication trials & diamagnetism...",
  "Assess silicon neuromorphic photonic tensor processors vs GPU cluster throughput...",
  "Explore high-density intracortical neural lace decoding bandwidth in human trials...",
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

  // Typewriter rotation when input is empty
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

      let speed = isDeleting ? 20 : 45;

      if (!isDeleting && charIndex === currentPhrase.length) {
        speed = 2400;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % TYPEWRITER_PHRASES.length;
        speed = 350;
      }

      timeoutId = setTimeout(tick, speed);
    }

    timeoutId = setTimeout(tick, 300);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [value, isListening]);

  // Speech Recognition API
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
          inputRef.current?.focus();
        }
      };
      recognitionRef.current = rec;
    }
  }, [onChange]);

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
        inputRef.current?.focus();
      }
    } catch (err) {
      console.warn("Enhance failed:", err);
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
    ? "Acoustic sensor active... Speak your research topic clearly"
    : placeholder || typewriterText || "Enter scientific research directive, hypothesis, or technical query...";

  const isWorkbench = variant === "workbench";
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  const isDark = theme === "dark";

  return (
    <div
      className={`relative w-full transition-all duration-300 select-none ${
        isWorkbench
          ? isDark
            ? "rounded-2xl p-3 sm:p-4 bg-[#13151D] border border-white/[0.10] shadow-[0_20px_45px_-10px_rgba(0,0,0,0.65)]"
            : "rounded-2xl p-3 sm:p-4 bg-white border border-black/[0.09] shadow-[0_16px_36px_-10px_rgba(0,0,0,0.06)]"
          : isDark
          ? "rounded-xl p-2.5 sm:p-3 bg-[#13151D] border border-white/[0.10] shadow-[0_12px_28px_-6px_rgba(0,0,0,0.5)]"
          : "rounded-xl p-2.5 sm:p-3 bg-white border border-black/[0.09] shadow-[0_10px_24px_-6px_rgba(0,0,0,0.05)]"
      }`}
    >
      {/* Top Console Deck: Dual Rocker Mode Switcher */}
      <div className="flex items-center justify-between gap-3 pb-2 mb-1.5 border-b border-[var(--island-border)]">
        {/* Tactile Mode Rocker */}
        <div className={`inline-flex p-0.5 sm:p-1 rounded-xl border ${isDark ? "bg-[#0B0C10] border-white/[0.07]" : "bg-[#F0F2F6] border-black/[0.06]"}`}>
          <button
            type="button"
            onClick={() => setMode?.("deep")}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-lg text-[11.5px] font-mono font-semibold transition-all cursor-pointer ${
              mode === "deep"
                ? isDark
                  ? "bg-[#161B29] text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 shadow-xs"
                  : "bg-white text-[var(--accent-primary)] border border-black/[0.08] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>CrewAI Deep Swarm</span>
            <span className={`hidden sm:inline text-[9.5px] px-1 py-0.2 rounded font-mono ${isDark ? "bg-black/50 text-[var(--accent-primary)]" : "bg-black/[0.05] text-[var(--accent-primary)]"}`}>
              ~12s
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode?.("fast")}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-lg text-[11.5px] font-mono font-semibold transition-all cursor-pointer ${
              mode === "fast"
                ? isDark
                  ? "bg-[#161B29] text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 shadow-xs"
                  : "bg-white text-[var(--accent-primary)] border border-black/[0.08] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Rapid Synthesis</span>
            <span className={`hidden sm:inline text-[9.5px] px-1 py-0.2 rounded font-mono ${isDark ? "bg-black/50 text-[var(--accent-primary)]" : "bg-black/[0.05] text-[var(--accent-primary)]"}`}>
              &lt;400ms
            </span>
          </button>
        </div>

        {/* Engine Status Beacon */}
        <div className="hidden xs:flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[var(--text-muted)] opacity-80">Swarm Ready</span>
        </div>
      </div>

      {/* Main Command Input Area */}
      <div className="relative flex items-start gap-2.5 my-1">
        <textarea
          ref={inputRef}
          rows={isWorkbench ? 2 : 1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isEnhancing}
          placeholder={activePlaceholder}
          className="flex-1 w-full bg-transparent border-none outline-none resize-none text-[var(--text-main)] text-[14.5px] sm:text-[15.5px] font-normal placeholder:text-[var(--text-muted)] placeholder:opacity-60 py-1 px-1 leading-relaxed selection:bg-[#FF5C00]/30"
          autoComplete="off"
          style={{ caretColor: "var(--accent-primary)" }}
        />
      </div>

      {/* Bottom Action Deck */}
      <div className="flex items-center justify-between pt-3 mt-1 border-t border-[var(--island-border)] text-[11.5px] font-mono text-[var(--text-muted)]">
        {/* Left Stats */}
        <div className="flex items-center gap-3">
          <span className="opacity-75">{wordCount} words</span>
          {isWorkbench && (
            <span className="hidden sm:inline opacity-50">• Press Enter to execute</span>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Enhance Button */}
          <HoverPill text="Enhance prompt into structured academic inquiry">
            <button
              type="button"
              onClick={handleEnhance}
              disabled={disabled || isEnhancing || !value.trim()}
              className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-[11px] font-mono font-semibold bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isEnhancing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isEnhancing ? "Refining..." : "Enhance"}</span>
            </button>
          </HoverPill>

          {/* Voice Dictation (Mic) */}
          <HoverPill text={isListening ? "Stop Voice Dictation" : "Voice Dictation"}>
            <button
              type="button"
              onClick={toggleMic}
              disabled={disabled || isEnhancing}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse"
                  : "bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-[var(--text-main)] hover:border-[var(--text-muted)] active:scale-95"
              }`}
            >
              <Mic className="w-3.5 h-3.5 opacity-80" />
            </button>
          </HoverPill>

          {/* Execute Directive Button */}
          <button
            type="button"
            onClick={() => onSend(value, mode)}
            disabled={disabled || !value.trim() || isEnhancing}
            className="h-8 px-3.5 rounded-lg flex items-center gap-1.5 bg-[var(--accent-primary)] text-white hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-bold shadow-xs text-[12px]"
          >
            <span>Execute</span>
            <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}

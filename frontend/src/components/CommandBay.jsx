import React, { useRef, useState, useEffect } from "react";
import { Mic, ArrowUp, Sparkles, Loader2, Compass } from "lucide-react";

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
  researchActive = true,
  setResearchActive,
  variant = "workbench", // "workbench" (homepage hero) | "dock" (chat bottom)
  theme = "dark",
}) {
  const [isListening, setIsListening] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Typewriter placeholder rotation
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

      let speed = isDeleting ? 18 : 40;

      if (!isDeleting && charIndex === currentPhrase.length) {
        speed = 2200;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % TYPEWRITER_PHRASES.length;
        speed = 300;
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
      if (value.trim() && !disabled) {
        onSend(value, researchActive);
      }
    }
  };

  const activePlaceholder = isListening
    ? "Acoustic sensor active... Speak your research query clearly"
    : placeholder || typewriterText || "Ask a technical research question, hypothesis, or topic...";

  const isWorkbench = variant === "workbench";
  const isDark = theme === "dark";

  return (
    <div
      className={`relative w-full transition-all duration-200 select-none ${
        isWorkbench
          ? isDark
            ? "rounded-2xl p-3 sm:p-4 bg-[#14161F] border border-white/[0.12] shadow-[0_16px_40px_-10px_rgba(0,0,0,0.6)] focus-within:border-[var(--accent-primary)]/60 focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20"
            : "rounded-2xl p-3 sm:p-4 bg-white border border-black/[0.12] shadow-[0_16px_36px_-10px_rgba(0,0,0,0.06)] focus-within:border-[var(--accent-primary)]/60 focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/15"
          : isDark
          ? "rounded-2xl p-2.5 sm:p-3 bg-[#14161F] border border-white/[0.12] shadow-[0_12px_30px_-6px_rgba(0,0,0,0.5)] focus-within:border-[var(--accent-primary)]/60 focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20"
          : "rounded-2xl p-2.5 sm:p-3 bg-white border border-black/[0.12] shadow-[0_10px_24px_-6px_rgba(0,0,0,0.05)] focus-within:border-[var(--accent-primary)]/60 focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/15"
      }`}
    >
      {/* Main Textarea Input */}
      <div className="relative flex items-start gap-2">
        <textarea
          ref={inputRef}
          rows={isWorkbench ? 2 : 1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isEnhancing}
          placeholder={activePlaceholder}
          className="flex-1 w-full bg-transparent border-none outline-none resize-none text-[var(--text-main)] text-[14px] sm:text-[15px] font-normal placeholder:text-[var(--text-muted)] placeholder:opacity-55 py-1 px-1 leading-relaxed selection:bg-[#2563EB]/30"
          autoComplete="off"
          style={{ caretColor: "var(--accent-primary)" }}
        />
      </div>

      {/* Bottom Control & Action Bar */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-[var(--island-border)] text-[11px] font-mono text-[var(--text-muted)]">
        {/* Left: Research Priority Pill */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setResearchActive?.((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
              researchActive
                ? isDark
                  ? "bg-[var(--highlight-bg)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 shadow-xs"
                  : "bg-blue-50 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 shadow-xs"
                : "bg-transparent text-[var(--text-muted)] border border-transparent hover:text-[var(--text-main)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            }`}
            title="Toggle Research Priority (prioritizes arXiv preprints and multi-agent synthesis)"
          >
            <Compass className={`w-3 h-3 ${researchActive ? "text-[var(--accent-primary)]" : ""}`} />
            <span>Research</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                researchActive
                  ? isDark
                    ? "bg-black/40 text-[var(--accent-primary)]"
                    : "bg-white text-[var(--accent-primary)]"
                  : "opacity-60"
              }`}
            >
              {researchActive ? "Priority" : "Auto"}
            </span>
          </button>
        </div>

        {/* Right Actions: Enhance, Mic, Execute */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Enhance Button */}
          <button
            type="button"
            onClick={handleEnhance}
            disabled={disabled || isEnhancing || !value.trim()}
            className="h-7.5 px-2.5 rounded-lg flex items-center gap-1 text-[11px] font-mono font-medium bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Refine prompt into academic inquiry"
          >
            {isEnhancing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span className="hidden xs:inline">{isEnhancing ? "Refining..." : "Enhance"}</span>
          </button>

          {/* Voice Dictation (Mic) */}
          <button
            type="button"
            onClick={toggleMic}
            disabled={disabled || isEnhancing}
            className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse"
                : "bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] text-[var(--text-main)] hover:border-[var(--text-muted)] active:scale-95"
            }`}
            title={isListening ? "Stop voice dictation" : "Voice dictation"}
          >
            <Mic className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Execute Button */}
          <button
            type="button"
            onClick={() => onSend(value, researchActive)}
            disabled={disabled || !value.trim() || isEnhancing}
            className="h-7.5 px-3 rounded-lg flex items-center gap-1 bg-[var(--accent-primary)] text-white hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-bold shadow-xs text-[11.5px]"
            title="Send query (Enter)"
          >
            <span>Ask</span>
            <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}

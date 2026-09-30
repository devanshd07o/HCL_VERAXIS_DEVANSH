import React, { useRef, useState, useEffect } from "react";
import { Mic, ArrowUp, Sparkles, Loader2 } from "lucide-react";
import HoverPill from "./HoverPill";

const TYPEWRITER_PHRASES = [
  "Investigate solid-state battery ceramic electrolyte benchmarks...",
  "Evaluate CRISPR-Cas9 in vivo base editing clinical breakthroughs...",
  "Analyze NIST Post-Quantum lattice cryptography vulnerabilities...",
  "Audit commercial nuclear fusion net-energy Q-factor milestones...",
  "Cross-verify room-temperature superconductor replication trials...",
  "Assess neuromorphic photonic tensor processors vs GPU clusters...",
  "Explore high-density brain-computer interface decoding bandwidth...",
];

export default function LiquidGlassInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
  widthClass = "max-w-[940px]",
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

      let speed = isDeleting ? 25 : 55;

      if (!isDeleting && charIndex === currentPhrase.length) {
        speed = 2200;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % TYPEWRITER_PHRASES.length;
        speed = 450;
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
          onSend(transcript);
        }
      };
      recognitionRef.current = rec;
    }
  }, [onChange, onSend]);

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
        onSend(enhanced);
      } else {
        onSend(value);
      }
    } catch (err) {
      console.warn("Enhance failed, executing default send:", err);
      onSend(value);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend(value);
    }
  };

  const activePlaceholder = isListening
    ? "Listening... Speak your research topic"
    : placeholder || typewriterText || "Ask a question or enter a research topic...";

  return (
    <div
      className={`relative w-full ${widthClass} min-h-[62px] sm:min-h-[66px] px-4 sm:px-5 flex items-center gap-2.5 sm:gap-3 rounded-2xl liquid-glass-input transition-all mx-auto`}
      style={{
        backgroundColor: "var(--input-dock-bg)",
        border: "1px solid var(--input-border)",
        boxShadow: "var(--input-shadow)",
      }}
    >
      {/* Primary Input Field - Squarish with rounded corners, 100% visible */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isEnhancing}
        placeholder={activePlaceholder}
        className="relative z-10 flex-1 h-full py-3 bg-transparent border-none outline-none text-[var(--text-main)] text-[15px] sm:text-[16px] font-normal placeholder:text-[var(--text-muted)] placeholder:opacity-65 px-1 truncate"
        autoComplete="off"
        style={{ caretColor: "var(--accent-cyan)" }}
      />

      {/* Right Action Cluster: Enhance, Mic and Send */}
      <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Enhance Query Button Pill */}
        <HoverPill text="Enhance Prompt with Deep AI Search Refinement">
          <button
            type="button"
            onClick={handleEnhance}
            disabled={disabled || isEnhancing || !value.trim()}
            className="h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 text-[11.5px] sm:text-[12px] font-semibold bg-[var(--highlight-bg)] border border-[var(--accent-cyan)]/35 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
          >
            {isEnhancing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-cyan)] animate-pulse" />
            )}
            <span className="hidden xs:inline">
              {isEnhancing ? "Enhancing..." : "Enhance"}
            </span>
          </button>
        </HoverPill>

        {/* Voice Dictation (Mic) Button */}
        <HoverPill text={isListening ? "Stop Voice Dictation" : "Voice Dictation"}>
          <button
            type="button"
            onClick={toggleMic}
            disabled={disabled || isEnhancing}
            className={`w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? "bg-rose-500/25 text-rose-400 border border-rose-500/50 animate-pulse"
                : "bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-[var(--glass-border)] active:scale-95"
            }`}
          >
            <Mic className="w-4 h-4 opacity-80" />
          </button>
        </HoverPill>

        {/* Send Button */}
        <HoverPill text="Send Research Query (Enter)">
          <button
            type="button"
            onClick={() => onSend(value)}
            disabled={disabled || !value.trim() || isEnhancing}
            className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl flex items-center justify-center bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] text-white hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </HoverPill>
      </div>
    </div>
  );
}

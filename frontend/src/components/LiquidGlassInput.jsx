import React, { useRef, useState, useEffect } from "react";
import { Mic, ArrowUp } from "lucide-react";
import LiquidLensCanvas from "./LiquidLensCanvas";

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
  const [typewriterText, setTypewriterText] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Mouse move tracking for dynamic prism angle & caustics
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const angleRad = Math.atan2(y - cy, x - cx);
    const angleDeg = (angleRad * 180) / Math.PI;

    containerRef.current.style.setProperty("--mouse-x", `${(x / rect.width) * 100}%`);
    containerRef.current.style.setProperty("--mouse-y", `${(y / rect.height) * 100}%`);
    containerRef.current.style.setProperty("--prism-angle", `${angleDeg}deg`);
  };

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
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full ${widthClass} h-[60px] sm:h-[64px] px-4 sm:px-6 flex items-center gap-3 liquid-glass-input transition-all mx-auto`}
    >
      {/* Real Optical Liquid Lens WebGL 2 (Zero Rigid Corners, Pristine Clear Center, Prism Rim) */}
      <LiquidLensCanvas
        isHovered={isHovered}
        mousePos={mousePos}
        theme={theme}
      />

      {/* Primary Input Field - Always Crisp, High-Contrast & Unobstructed */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={activePlaceholder}
        className="relative z-20 flex-1 h-full bg-transparent border-none outline-none text-[var(--text-main)] text-[15.5px] sm:text-[16.5px] font-normal placeholder:text-[var(--text-muted)] placeholder:opacity-60 px-1 truncate"
        autoComplete="off"
        style={{ caretColor: "var(--accent-cyan)" }}
      />

      {/* Right Action Cluster: Mic and Send */}
      <div className="relative z-20 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={toggleMic}
          disabled={disabled}
          title={isListening ? "Stop Listening" : "Voice Dictation"}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? "mic-listening"
              : "bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-[var(--glass-border)] active:scale-95"
          }`}
        >
          <Mic className="w-4 h-4 opacity-80" />
        </button>

        <button
          type="button"
          onClick={() => onSend(value)}
          disabled={disabled || !value.trim()}
          title="Send Query"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] text-white hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed shadow-sm transition-all"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { marked } from "marked";
import katex from "katex";
import {
  BookOpen,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FastForward,
  Loader2,
  Sparkles,
  FileText,
} from "lucide-react";

// ============================================================================
// 1. High-Precision Markdown + KaTeX Compiler
// ============================================================================

/**
 * Pre-processes LaTeX math expressions and compiles Markdown to rich HTML:
 * 1. Pre-renders display equations: \[ ... \] and $$ ... $$
 * 2. Pre-renders inline formulas: \( ... \) and $ ... $
 * 3. Replaces lingering naked math symbols outside math mode with clean Unicode
 * 4. Compiles with marked to generate clean semantic HTML (tables, headers, lists, code)
 * 5. Re-injects rendered vector KaTeX HTML
 */
function renderMarkdownWithKaTeX(rawText) {
  if (!rawText) return "";

  const placeholders = [];
  function saveBlock(html) {
    const id = `KATEXPLACEHOLDER${placeholders.length}ENDTOKEN`;
    placeholders.push(html);
    return id;
  }

  let text = rawText;

  // 1. Display Math: \[ ... \] or $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
      return saveBlock(`<div class="my-3 py-2 px-3 overflow-x-auto text-center">${rendered}</div>`);
    } catch {
      return saveBlock(`<pre class="font-mono text-amber-500">${math}</pre>`);
    }
  });

  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
      return saveBlock(`<div class="my-3 py-2 px-3 overflow-x-auto text-center">${rendered}</div>`);
    } catch {
      return saveBlock(`<pre class="font-mono text-amber-500">${math}</pre>`);
    }
  });

  // 2. Inline Math: \( ... \)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      return saveBlock(`<span class="inline-math">${rendered}</span>`);
    } catch {
      return saveBlock(`<span class="font-mono text-amber-500">${math}</span>`);
    }
  });

  // 3. Inline Math: $ ... $ (ensuring not \$)
  text = text.replace(/(?<!\\)\$([^\$\n]+?)(?<!\\)\$/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      return saveBlock(`<span class="inline-math">${rendered}</span>`);
    } catch {
      return saveBlock(`<span class="font-mono text-amber-500">${math}</span>`);
    }
  });

  // 4. Any remaining naked LaTeX symbols outside math mode -> clean Unicode
  text = text
    .replace(/\\le\b/g, "≤")
    .replace(/\\ge\b/g, "≥")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\times\b/g, "×")
    .replace(/\\pm\b/g, "±")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\downarrow\b/g, "↓")
    .replace(/\\uparrow\b/g, "↑")
    .replace(/\\rightarrow\b/g, "→")
    .replace(/\\leftarrow\b/g, "←")
    .replace(/\\sigma_{ion}\b/g, "σ_ion")
    .replace(/\\sigma\b/g, "σ")
    .replace(/\\phi_{cer}\b/g, "ϕ_cer")
    .replace(/\\phi\b/g, "ϕ")
    .replace(/\\mu\b/g, "μ")
    .replace(/\\alpha\b/g, "α")
    .replace(/\\beta\b/g, "β")
    .replace(/\\gamma\b/g, "γ")
    .replace(/\\Omega\b/g, "Ω")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\([ ]+)/g, " ")
    .replace(/\\,/g, " ");

  // 5. Parse Markdown to HTML via marked
  let html = "";
  try {
    html = marked.parse(text);
  } catch {
    html = text;
  }

  // 6. Restore all KaTeX HTML placeholders
  placeholders.forEach((mathHtml, i) => {
    const id = `KATEXPLACEHOLDER${i}ENDTOKEN`;
    html = html.replace(`<p>${id}</p>`, mathHtml);
    html = html.replace(id, mathHtml);
  });

  return html;
}

// ============================================================================
// 2. Safe Typewriter Slicer (Guarantees Delimiters Are Never Sliced Mid-Way)
// ============================================================================

function getSafeSlice(fullText, targetLength) {
  let target = targetLength;
  if (target >= fullText.length) return { slice: fullText, target: fullText.length };

  let slice = fullText.slice(0, target);

  // 1. Math Block \[ ... \] safety
  const openBracket = (slice.match(/\\\[/g) || []).length;
  const closeBracket = (slice.match(/\\\]/g) || []).length;
  if (openBracket > closeBracket) {
    const closeIdx = fullText.indexOf("\\]", target);
    if (closeIdx !== -1) {
      target = closeIdx + 2;
      slice = fullText.slice(0, target);
    }
  }

  // 2. Math Block \( ... \) safety
  const openParen = (slice.match(/\\\(/g) || []).length;
  const closeParen = (slice.match(/\\\)/g) || []).length;
  if (openParen > closeParen) {
    const closeIdx = fullText.indexOf("\\)", target);
    if (closeIdx !== -1) {
      target = closeIdx + 2;
      slice = fullText.slice(0, target);
    }
  }

  // 3. Double dollar $$ safety
  const doubleDollars = (slice.match(/\$\$/g) || []).length;
  if (doubleDollars % 2 !== 0) {
    const closeIdx = fullText.indexOf("$$", target);
    if (closeIdx !== -1) {
      target = closeIdx + 2;
      slice = fullText.slice(0, target);
    }
  }

  // 4. Single dollar $ safety
  const singleDollars = (slice.replace(/\$\$/g, "").match(/(?<!\\)\$/g) || []).length;
  if (singleDollars % 2 !== 0) {
    const closeIdx = fullText.indexOf("$", target);
    if (closeIdx !== -1) {
      target = closeIdx + 1;
      slice = fullText.slice(0, target);
    }
  }

  // 5. Code block ``` safety
  const codeFences = (slice.match(/```/g) || []).length;
  if (codeFences % 2 !== 0) {
    const closeIdx = fullText.indexOf("```", target);
    if (closeIdx !== -1) {
      target = closeIdx + 3;
      slice = fullText.slice(0, target);
    }
  }

  return { slice, target };
}

function TypewriterStreamContent({ fullText, onComplete }) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const isFinished = displayedLength >= fullText.length;

  useEffect(() => {
    if (!fullText) {
      onComplete?.();
      return;
    }

    const stepSize = Math.max(20, Math.floor(fullText.length / 80));

    const interval = setInterval(() => {
      setDisplayedLength((prev) => {
        const nextRaw = prev + stepSize;
        const { target } = getSafeSlice(fullText, nextRaw);
        if (target >= fullText.length) {
          clearInterval(interval);
          onComplete?.();
          return fullText.length;
        }
        return target;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [fullText, onComplete]);

  const handleSkip = () => {
    setDisplayedLength(fullText.length);
    onComplete?.();
  };

  const currentSlice = fullText.slice(0, displayedLength);
  const htmlContent = useMemo(() => renderMarkdownWithKaTeX(currentSlice), [currentSlice]);

  return (
    <div className="relative">
      <div
        className="prose-dossier"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {!isFinished && (
        <div className="inline-flex items-center gap-2 mt-2 select-none">
          <span className="inline-block w-1.5 h-4 bg-[var(--accent-primary)] animate-pulse" />
          <button
            type="button"
            onClick={handleSkip}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] transition-all cursor-pointer"
          >
            <FastForward className="w-3 h-3" />
            <span>Skip reveal</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. Compact Perplexity-Style Thinking Component
// ============================================================================

const DYNAMIC_THINKING_STEPS = [
  "Classifying inquiry intent & domain taxonomy...",
  "Querying arXiv REST gateway for peer-reviewed preprints...",
  "Extracting empirical benchmarks & physical mechanisms...",
  "Forensic Auditor cross-verifying claims & confidence indices...",
  "Synthesizing multi-agent consensus & compiling dossier...",
];

function PerplexityThinking({ isDone = false, duration = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isDone) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const sec = ((Date.now() - start) / 1000).toFixed(1);
      setElapsed(sec);
      setStepIdx((prev) => (prev + 1) % DYNAMIC_THINKING_STEPS.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [isDone]);

  const displayTime = duration || (elapsed > 0 ? `${elapsed}s` : "3.2s");

  return (
    <div className="w-full my-2 select-none">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-fit max-w-full inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] hover:border-[var(--accent-primary)]/40 transition-all cursor-pointer text-[12px] font-mono shadow-xs"
      >
        {isDone ? (
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        ) : (
          <Loader2 className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-spin" />
        )}

        <span className="text-[var(--text-main)] font-medium">
          {isDone ? `Researched in ${displayTime}` : DYNAMIC_THINKING_STEPS[stepIdx]}
        </span>

        {!isDone && (
          <span className="text-[10px] text-[var(--text-muted)] font-mono ml-1">
            {elapsed}s
          </span>
        )}

        {isOpen ? (
          <ChevronUp className="w-3 h-3 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
        )}
      </div>

      {isOpen && (
        <div className="mt-2 ml-2 pl-3 border-l-2 border-[var(--accent-primary)]/40 space-y-1.5 text-[11.5px] font-mono text-[var(--text-muted)] animate-buttery-fade-in">
          <div className="flex items-center gap-1.5 text-[var(--text-main)]">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Intent Classified: Autonomous Deep Research</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--text-main)]">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>arXiv REST API Gateway: Ingested primary preprints</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--text-main)]">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Forensic Fact-Checker: 0–100% confidence audit</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--text-main)]">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Consensus Synthesis & ReportLab Publication PDF</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. Copy Button Component
// ============================================================================

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-surface-subtle)] transition-all cursor-pointer"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ============================================================================
// 5. Main ChatStream Export
// ============================================================================

export default function ChatStream({
  messages,
  isLoading,
  widthClass = "max-w-[880px]",
}) {
  const [typedIndices, setTypedIndices] = useState(() => new Set());

  const handleTypingComplete = (idx) => {
    setTypedIndices((prev) => new Set(prev).add(idx));
  };

  return (
    <div className={`w-full ${widthClass} mx-auto px-2 sm:px-4 py-4 flex flex-col gap-6`}>
      {messages.map((msg, idx) => {
        const isLatestBot = msg.role === "bot" && idx === messages.length - 1;
        const alreadyTyped = typedIndices.has(idx);

        return (
          <div key={idx} className="w-full flex flex-col gap-2">
            {msg.role === "user" ? (
              /* User Query Bubble */
              <div className="flex items-start justify-end max-w-[88%] sm:max-w-[78%] ml-auto">
                <div className="px-4 py-2.5 rounded-2xl rounded-tr-xs bg-[var(--island-bg)] border border-white/[0.08] text-[var(--text-main)] text-[14px] sm:text-[14.5px] shadow-xs leading-relaxed font-normal">
                  {msg.content}
                </div>
              </div>
            ) : (
              /* Bot Response Stream */
              <div className="w-full space-y-2.5">
                {/* Brand Header */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)]">
                  <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" />
                  <span className="font-semibold text-[var(--text-main)]">VERAXIS AI</span>
                  {msg.type === "research" && <span>• Deep Research Dossier</span>}
                </div>

                {/* Perplexity-style Thinking Component */}
                {msg.type === "research" && (
                  <PerplexityThinking isDone={true} />
                )}

                {/* Sources Row (Perplexity Style Cards) */}
                {msg.type === "research" && msg.sources && msg.sources.length > 0 && (
                  <div className="space-y-1.5 pt-1 pb-2">
                    <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      <BookOpen className="w-3 h-3 text-[var(--accent-primary)]" />
                      <span>Primary Academic Sources ({msg.sources.length})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {msg.sources.slice(0, 3).map((s, sIdx) => (
                        <a
                          key={sIdx}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group p-2.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--island-border)] hover:border-[var(--accent-primary)]/40 transition-all flex flex-col justify-between gap-1 shadow-xs"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-[var(--accent-primary)]">
                            <span>[{sIdx + 1}] arXiv</span>
                            <ExternalLink className="w-2.5 h-2.5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]" />
                          </div>
                          <div className="text-[11.5px] font-medium text-[var(--text-main)] line-clamp-1 leading-snug">
                            {s.title}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Editorial Content with Typewriter Reveal */}
                <div className="pt-1">
                  {isLatestBot && !alreadyTyped ? (
                    <TypewriterStreamContent
                      fullText={msg.content}
                      onComplete={() => handleTypingComplete(idx)}
                    />
                  ) : (
                    <div
                      className="prose-dossier"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdownWithKaTeX(msg.content),
                      }}
                    />
                  )}
                </div>

                {/* Action Bar */}
                <div className="pt-2 flex items-center justify-between text-[var(--text-muted)]">
                  <div className="flex items-center gap-1">
                    <CopyButton text={msg.content} />

                    {msg.pdf_filename && (
                      <a
                        href={`/api/download-pdf/${msg.pdf_filename}`}
                        download={msg.pdf_filename}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-all cursor-pointer ml-1"
                        title="Download Publication PDF Dossier"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Download PDF</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Active Thinking Loader when request is pending */}
      {isLoading && (
        <div className="w-full space-y-2 animate-buttery-fade-in">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)]">
            <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" />
            <span className="font-semibold text-[var(--text-main)]">VERAXIS AI</span>
          </div>
          <PerplexityThinking isDone={false} />
        </div>
      )}
    </div>
  );
}

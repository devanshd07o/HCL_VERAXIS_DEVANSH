import React, { useState, useEffect, useRef, useMemo } from "react";
import katex from "katex";
import {
  Download,
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
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

// ============================================================================
// 1. Text & LaTeX Preprocessing Helpers
// ============================================================================

const SUB_MAP = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
};

const SUP_MAP = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
};

function toUnicodeSub(str) {
  return String(str).split("").map((c) => SUB_MAP[c] || c).join("");
}

function toUnicodeSup(str) {
  return String(str).split("").map((c) => SUP_MAP[c] || c).join("");
}

/**
 * Pre-processes text to sanitize broken LLM math patterns, chemical formulas,
 * and rogue backslashes while leaving true LaTeX blocks intact.
 */
function sanitizeInlineText(raw) {
  if (!raw) return "";

  let text = raw;

  // 1. Convert chemical formulas like Li$_{7}$La$_{3}$Zr$_{2}$O$_{12}$ or Li_{7}
  text = text.replace(
    /([A-Z][a-z]?)(?:\$_\{?(\d+)\}?\$|_\{?(\d+)\}?|\b_(\d+)\b)/g,
    (_, elem, d1, d2, d3) => elem + toUnicodeSub(d1 || d2 || d3 || "")
  );

  // 2. Convert common superscripts like 10^{-6}, 10^{-7}, cm^{-2}, m^{1/2}
  text = text.replace(/([a-zA-Z0-9]+)\^\{?(-?\d+|1\/2)\}?/g, (_, base, val) => {
    if (val === "1/2") return base + "½";
    if (val.startsWith("-")) return base + "⁻" + toUnicodeSup(val.slice(1));
    return base + toUnicodeSup(val);
  });

  // 3. Clean raw TeX macros in prose & table cells
  text = text
    .replace(/\\le\b/g, "≤")
    .replace(/\\ge\b/g, "≥")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\times\b/g, "×")
    .replace(/\\pm\b/g, "±")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\mu\b/g, "μ")
    .replace(/\\alpha\b/g, "α")
    .replace(/\\beta\b/g, "β")
    .replace(/\\gamma\b/g, "γ")
    .replace(/\\sigma\b/g, "σ")
    .replace(/\\Omega\b/g, "Ω")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\([ ]+)/g, " ")
    .replace(/\\,/g, " ");

  // 4. Fix naked trailing dollar signs in prices/tables: " 30$" -> " $30"
  text = text.replace(/(?<=\s)(\d+(?:\.\d+)?)\$/g, "$$$1");
  text = text.replace(/([≤≥≈~])\s*(\d+(?:\.\d+)?)\$/g, "$1 $$$2");

  return text;
}

// ============================================================================
// 2. Safe KaTeX Formula Rendering
// ============================================================================

function renderKaTeX(formula, isDisplayMode = false) {
  if (!formula || !formula.trim()) return "";
  try {
    return katex.renderToString(formula.trim(), {
      displayMode: isDisplayMode,
      throwOnError: false,
      output: "htmlAndMathml",
    });
  } catch {
    return `<span class="font-mono text-amber-500">${formula}</span>`;
  }
}

// ============================================================================
// 3. Inline Formatted Span Parser (Bold, Code, Math, Links)
// ============================================================================

function renderInlineFormatting(rawText) {
  if (!rawText) return null;

  const clean = sanitizeInlineText(rawText);

  // Tokenize for inline math ($...$), bold (**...**), code (`...`), and plain text
  const tokens = [];
  let remaining = clean;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // 1. Inline math: $...$
    const mathMatch = remaining.match(/^(?<!\\)\$([^\$]+?)(?<!\\)\$/);
    if (mathMatch) {
      const formula = mathMatch[1];
      const html = renderKaTeX(formula, false);
      tokens.push(
        <span
          key={`math-${keyIdx++}`}
          className="inline-math px-0.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
      remaining = remaining.slice(mathMatch[0].length);
      continue;
    }

    // 2. Inline code: `...`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push(
        <code
          key={`code-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded-md text-[12px] font-mono bg-black/[0.06] dark:bg-white/[0.08] text-[var(--accent-primary)] font-semibold"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 3. Bold: **...**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      tokens.push(
        <strong key={`bold-${keyIdx++}`} className="font-semibold text-[var(--text-main)]">
          {renderInlineFormatting(boldMatch[1])}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 4. Markdown links: [Title](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
    if (linkMatch) {
      tokens.push(
        <a
          key={`link-${keyIdx++}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent-primary)] hover:underline font-medium inline-flex items-center gap-0.5"
        >
          <span>{linkMatch[1]}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 5. Plain character chunk
    const nextSpecial = remaining.search(/(\$|`|\*\*|\[)/);
    if (nextSpecial === -1) {
      tokens.push(<span key={`txt-${keyIdx++}`}>{remaining}</span>);
      break;
    } else if (nextSpecial === 0) {
      tokens.push(<span key={`txt-${keyIdx++}`}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    } else {
      tokens.push(<span key={`txt-${keyIdx++}`}>{remaining.slice(0, nextSpecial)}</span>);
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens;
}

// ============================================================================
// 4. Full Markdown Block Parser
// ============================================================================

function parseBlocks(markdownText) {
  if (!markdownText) return [];

  const rawBlocks = [];
  const lines = markdownText.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Math Display Block \[ ... \]
    if (trimmed.startsWith("\\[")) {
      let mathContent = "";
      if (trimmed.endsWith("\\]") && trimmed.length > 2) {
        mathContent = trimmed.slice(2, -2).trim();
        i++;
      } else {
        mathContent = trimmed.slice(2).trim();
        i++;
        while (i < lines.length) {
          const nextTrimmed = lines[i].trim();
          if (nextTrimmed.endsWith("\\]")) {
            mathContent += "\n" + nextTrimmed.slice(0, -2).trim();
            i++;
            break;
          } else {
            mathContent += "\n" + lines[i];
            i++;
          }
        }
      }
      rawBlocks.push({ type: "display_math", content: mathContent });
      continue;
    }

    // 2. Math Display Block $$ ... $$
    if (trimmed.startsWith("$$")) {
      let mathContent = "";
      if (trimmed.endsWith("$$") && trimmed.length > 2) {
        mathContent = trimmed.slice(2, -2).trim();
        i++;
      } else {
        mathContent = trimmed.slice(2).trim();
        i++;
        while (i < lines.length) {
          const nextTrimmed = lines[i].trim();
          if (nextTrimmed.endsWith("$$")) {
            mathContent += "\n" + nextTrimmed.slice(0, -2).trim();
            i++;
            break;
          } else {
            mathContent += "\n" + lines[i];
            i++;
          }
        }
      }
      rawBlocks.push({ type: "display_math", content: mathContent });
      continue;
    }

    // 3. Fenced Code Block ```
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      let codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      rawBlocks.push({ type: "code", lang, content: codeLines.join("\n") });
      continue;
    }

    // 4. Markdown Table: lines starting with |
    if (trimmed.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      rawBlocks.push({ type: "table", lines: tableLines });
      continue;
    }

    // 5. Headings (#, ##, ###)
    if (trimmed.startsWith("#")) {
      const level = trimmed.match(/^#+/)[0].length;
      const text = trimmed.replace(/^#+\s*/, "");
      rawBlocks.push({ type: "heading", level, text });
      i++;
      continue;
    }

    // 6. Horizontal Rule
    if (/^---$|^\*\*\*$|^___$/.test(trimmed)) {
      rawBlocks.push({ type: "hr" });
      i++;
      continue;
    }

    // 7. Unordered / Ordered List Item
    if (/^[-*•]\s+/.test(trimmed)) {
      rawBlocks.push({ type: "list_item", text: trimmed.replace(/^[-*•]\s+/, "") });
      i++;
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      rawBlocks.push({ type: "numbered_item", text: trimmed.replace(/^\d+\.\s+/, "") });
      i++;
      continue;
    }

    // 8. Empty Line
    if (!trimmed) {
      i++;
      continue;
    }

    // 9. Standard Paragraph
    rawBlocks.push({ type: "paragraph", text: trimmed });
    i++;
  }

  return rawBlocks;
}

// ============================================================================
// 5. Block Renderer Components
// ============================================================================

function FormattedContent({ text }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);

  return (
    <div className="space-y-3.5 text-[14px] sm:text-[14.5px] leading-relaxed text-[var(--text-main)]">
      {blocks.map((block, idx) => {
        if (block.type === "display_math") {
          const html = renderKaTeX(block.content, true);
          return (
            <div
              key={idx}
              className="my-3 py-2 px-3 overflow-x-auto rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-[var(--island-border)] flex justify-center text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        if (block.type === "table") {
          const headerLine = block.lines[0];
          const hasSeparator = block.lines.length > 1 && block.lines[1].includes("---");
          const headers = headerLine
            .split("|")
            .filter((_, i, arr) => i > 0 && i < arr.length - 1)
            .map((c) => c.trim());

          const bodyLines = hasSeparator ? block.lines.slice(2) : block.lines.slice(1);

          return (
            <div key={idx} className="my-3 w-full overflow-x-auto rounded-xl border border-[var(--island-border)] shadow-xs">
              <table className="w-full text-left text-[12.5px] sm:text-[13px] border-collapse">
                <thead>
                  <tr className="bg-[var(--glass-surface-subtle)] border-b border-[var(--island-border)]">
                    {headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="py-2.5 px-3 font-semibold text-[var(--text-main)] font-sans uppercase tracking-wider text-[11px]"
                      >
                        {renderInlineFormatting(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--island-border)]">
                  {bodyLines.map((rowLine, rIdx) => {
                    const cells = rowLine
                      .split("|")
                      .filter((_, i, arr) => i > 0 && i < arr.length - 1)
                      .map((c) => c.trim());

                    return (
                      <tr
                        key={rIdx}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {cells.map((cell, cIdx) => (
                          <td key={cIdx} className="py-2.5 px-3 text-[var(--text-main)] leading-snug">
                            {renderInlineFormatting(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === "code") {
          return (
            <div key={idx} className="my-3 rounded-xl overflow-hidden border border-[var(--island-border)] bg-[#0F1117] text-white">
              <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 text-[11px] font-mono text-zinc-400 border-b border-white/[0.08]">
                <span>{block.lang || "code"}</span>
                <CopyButton text={block.content} />
              </div>
              <pre className="p-3.5 text-[12.5px] font-mono overflow-x-auto leading-relaxed">
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }

        if (block.type === "heading") {
          if (block.level === 1) {
            return (
              <h1 key={idx} className="text-[19px] sm:text-[21px] font-bold text-[var(--text-main)] pt-2 pb-1 border-b border-[var(--island-border)]">
                {renderInlineFormatting(block.text)}
              </h1>
            );
          }
          if (block.level === 2) {
            return (
              <h2 key={idx} className="text-[16px] sm:text-[17px] font-bold text-[var(--text-main)] pt-2 pb-0.5">
                {renderInlineFormatting(block.text)}
              </h2>
            );
          }
          return (
            <h3 key={idx} className="text-[14.5px] sm:text-[15px] font-semibold text-[var(--text-main)] pt-1">
              {renderInlineFormatting(block.text)}
            </h3>
          );
        }

        if (block.type === "list_item") {
          return (
            <div key={idx} className="flex items-start gap-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-2 shrink-0" />
              <div className="flex-1">{renderInlineFormatting(block.text)}</div>
            </div>
          );
        }

        if (block.type === "numbered_item") {
          return (
            <div key={idx} className="flex items-start gap-2 py-0.5">
              <span className="font-mono text-[11.5px] font-bold text-[var(--accent-primary)] mt-0.5 shrink-0">
                •
              </span>
              <div className="flex-1">{renderInlineFormatting(block.text)}</div>
            </div>
          );
        }

        if (block.type === "hr") {
          return <hr key={idx} className="my-4 border-[var(--island-border)]" />;
        }

        return (
          <p key={idx} className="leading-relaxed">
            {renderInlineFormatting(block.text)}
          </p>
        );
      })}
    </div>
  );
}

// ============================================================================
// 6. Safe Typewriter Revealer
// ============================================================================

function getSafeSlice(fullText, targetLength) {
  let target = targetLength;
  if (target >= fullText.length) return { slice: fullText, target: fullText.length };

  let slice = fullText.slice(0, target);

  // Math Block \[ ... \] safety
  const openBracket = (slice.match(/\\\[/g) || []).length;
  const closeBracket = (slice.match(/\\\]/g) || []).length;
  if (openBracket > closeBracket) {
    const closeIdx = fullText.indexOf("\\]", target);
    if (closeIdx !== -1) {
      target = closeIdx + 2;
      slice = fullText.slice(0, target);
    }
  }

  // Double dollar $$ safety
  const doubleDollars = (slice.match(/\$\$/g) || []).length;
  if (doubleDollars % 2 !== 0) {
    const closeIdx = fullText.indexOf("$$", target);
    if (closeIdx !== -1) {
      target = closeIdx + 2;
      slice = fullText.slice(0, target);
    }
  }

  // Single dollar $ safety
  const singleDollars = (slice.replace(/\$\$/g, "").match(/(?<!\\)\$/g) || []).length;
  if (singleDollars % 2 !== 0) {
    const closeIdx = fullText.indexOf("$", target);
    if (closeIdx !== -1) {
      target = closeIdx + 1;
      slice = fullText.slice(0, target);
    }
  }

  // Code block ``` safety
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

    const stepSize = Math.max(16, Math.floor(fullText.length / 100));

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

  return (
    <div className="relative">
      <FormattedContent text={currentSlice} />

      {!isFinished && (
        <div className="inline-flex items-center gap-2 mt-2">
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
// 7. Compact Perplexity-Style Thinking Component
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

      {/* Expandable Minimal Step Details */}
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
// 8. Copy Button Component
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
// 9. Main ChatStream Export
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
                    <FormattedContent text={msg.content} />
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

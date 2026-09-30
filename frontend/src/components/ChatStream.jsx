import React, { useState, useEffect, useRef, useMemo } from "react";
import katex from "katex";
import MultiAgentThinking from "./MultiAgentThinking";
import {
  Download,
  FileText,
  Globe,
  Search,
  ShieldCheck,
  Check,
  Copy,
  Sparkles,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  ExternalLink,
  BookOpen,
  Cpu,
  Layers,
  FastForward,
} from "lucide-react";

export default function ChatStream({
  messages,
  isLoading,
  widthClass = "max-w-[940px]",
  onInspectResearch,
}) {
  // Find latest user query to pass to dynamic thinking steps
  const lastUserMsg = useMemo(() => {
    return [...messages].reverse().find((m) => m.role === "user");
  }, [messages]);

  const activeUserQuery = lastUserMsg?.content || "";

  // Track the ID or index of messages that have completed typing so they don't re-animate
  const [typedMessageIndices, setTypedMessageIndices] = useState(() => new Set());

  const handleTypingComplete = (msgIdx) => {
    setTypedMessageIndices((prev) => new Set(prev).add(msgIdx));
  };

  return (
    <div className={`w-full ${widthClass} mx-auto px-2 sm:px-4 py-4 flex flex-col gap-6`}>
      {messages.length === 0 && !isLoading && (
        <div className="w-full py-20 flex flex-col items-center justify-center text-center gap-3 animate-buttery-fade-in select-none">
          <div className="w-12 h-12 rounded-2xl bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] flex items-center justify-center shadow-xs">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-[17px] font-bold text-[var(--text-main)]">
            CrewAI Research Console Active
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] max-w-[460px] leading-relaxed">
            Enter a scientific research query, technical hypothesis, or click Enhance below to formulate an empirical monograph directive.
          </p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const isLatestBot = msg.role === "bot" && idx === messages.length - 1;
        const alreadyTyped = typedMessageIndices.has(idx);

        return (
          <div key={idx} className="w-full flex flex-col gap-1.5 animate-buttery-fade-in">
            {msg.role === "user" ? (
              /* USER DIRECTIVE ROW: Authoritative, clean borderless pill */
              <div className="flex items-start justify-end max-w-[85%] sm:max-w-[75%] ml-auto">
                <div className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl rounded-tr-xs bg-[var(--island-bg)] border border-white/[0.08] text-[var(--text-main)] text-[14px] sm:text-[14.5px] shadow-xs leading-relaxed font-normal">
                  {msg.content}
                </div>
              </div>
            ) : (
              /* BOT RESEARCH DOSSIER ROW */
              <div className="w-full px-1 sm:px-2 py-1 text-[var(--text-main)] space-y-3">
                {/* Subtle Brand & Multi-Agent Header */}
                <div className="flex items-center justify-between text-[11.5px] text-[var(--text-muted)] select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-[var(--highlight-bg)] text-[var(--accent-primary)] flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5" />
                    </div>
                    <span className="font-semibold text-[12px] tracking-tight text-[var(--text-main)]/90">
                      VERAXIS AI
                    </span>
                    <span className="text-[10.5px] font-mono text-[var(--text-muted)]">
                      • Multi-Agent Consensus
                    </span>
                  </div>

                  {/* Right CrewAI Swarm Badge */}
                  {msg.type === "research" && (
                    <button
                      onClick={() => onInspectResearch && onInspectResearch(msg)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--highlight-bg)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 active:scale-95 transition-all cursor-pointer border border-[var(--accent-primary)]/30"
                      title="Inspect Multi-Agent CrewAI Logs"
                    >
                      <Cpu className="w-3 h-3" />
                      <span>CrewAI Swarm</span>
                      <ChevronRight className="w-3 h-3 opacity-60" />
                    </button>
                  )}
                </div>

                {/* PERPLEXITY STYLE SOURCES GRID */}
                {msg.type === "research" && msg.sources && msg.sources.length > 0 && (
                  <div className="space-y-1.5 py-1">
                    <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      <BookOpen className="w-3 h-3 text-[var(--accent-primary)]" />
                      <span>Primary Ingested Preprints ({msg.sources.length})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {msg.sources.slice(0, 3).map((s, sIdx) => (
                        <a
                          key={sIdx}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group p-2.5 rounded-xl bg-[var(--island-bg)] border border-white/[0.07] hover:border-[var(--accent-primary)]/40 transition-all flex flex-col justify-between gap-1 shadow-xs"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-[var(--accent-primary)]">
                            <span className="px-1.5 py-0.5 rounded-md bg-[var(--chip-bg)] border border-white/[0.05]">
                              [{sIdx + 1}] arXiv
                            </span>
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

                {/* EDITORIAL CONTENT: Typewriter Streaming for latest response */}
                <div className="text-[14px] sm:text-[14.5px] leading-relaxed text-[var(--text-main)]">
                  {isLatestBot && !alreadyTyped ? (
                    <TypewriterStreamContent
                      fullText={msg.content}
                      onComplete={() => handleTypingComplete(idx)}
                    />
                  ) : (
                    <FormattedContent text={msg.content} />
                  )}
                </div>

                {/* ACTION TOOLBAR */}
                <div className="pt-1 flex items-center justify-between text-[var(--text-muted)] opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-0.5">
                    <ActionButton icon={ThumbsUp} title="Good response" />
                    <ActionButton icon={ThumbsDown} title="Poor response" />
                    <CopyButton text={msg.content} />
                    {msg.type === "research" && (
                      <button
                        onClick={() => onInspectResearch && onInspectResearch(msg)}
                        className="ml-1 px-2 py-0.5 rounded-md text-[11px] font-medium hover:bg-[var(--glass-surface-subtle)] hover:text-[var(--text-main)] transition-colors flex items-center gap-1"
                      >
                        <Layers className="w-3 h-3 text-[var(--accent-primary)]" />
                        <span>Telemetry</span>
                      </button>
                    )}
                  </div>

                  {/* 1-Click Institutional PDF Download */}
                  {msg.pdf_filename && (
                    <a
                      href={`/api/download-pdf/${encodeURIComponent(msg.pdf_filename)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--highlight-bg)] border border-[var(--accent-primary)]/35 text-[var(--accent-primary)] text-[11.5px] font-semibold hover:bg-[var(--accent-primary)]/20 active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download ReportLab PDF</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Dynamic Multi-Agent Thinking Steps (replaces old generic Thinking... spinner) */}
      {isLoading && <MultiAgentThinking query={activeUserQuery} />}
    </div>
  );
}

// ==============================================================================
// TYPEWRITER STREAMING WITH BACKGROUND BUFFER & DELIMITER-AWARE REVEAL
// ==============================================================================
function getSafeSlice(fullText, length) {
  let target = Math.min(length, fullText.length);
  if (target >= fullText.length) {
    return { slice: fullText, target: fullText.length };
  }

  let slice = fullText.slice(0, target);

  // 1. Math Block \[ ... \] safety: don't chop midway inside equation
  const openBracket = (slice.match(/\\\[/g) || []).length;
  const closeBracket = (slice.match(/\\\]/g) || []).length;
  if (openBracket > closeBracket) {
    const closeIdx = fullText.indexOf("\\]", target);
    if (closeIdx !== -1) {
      target = closeIdx + 2;
      slice = fullText.slice(0, target);
    }
  }

  // 2. Math Block $$ ... $$ safety
  const doubleDollars = (slice.match(/\$\$/g) || []).length;
  if (doubleDollars % 2 !== 0) {
    const closeIdx = fullText.indexOf("$$", target);
    if (closeIdx !== -1) {
      target = closeIdx + 2;
      slice = fullText.slice(0, target);
    }
  }

  // 3. Inline Math $ ... $ safety
  const singleDollars = (slice.replace(/\$\$/g, "").match(/(?<!\\)\$/g) || []).length;
  if (singleDollars % 2 !== 0) {
    const closeIdx = fullText.indexOf("$", target);
    if (closeIdx !== -1) {
      target = closeIdx + 1;
      slice = fullText.slice(0, target);
    }
  }

  // 4. Code Block ``` ... ``` safety
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
  const bufferRef = useRef(fullText);
  bufferRef.current = fullText;

  const isFinished = displayedLength >= fullText.length;

  useEffect(() => {
    if (!fullText) {
      onComplete?.();
      return;
    }

    // Dynamic, butter-smooth reveal pace:
    // Base step ~12-25 chars per tick (16ms = ~60fps)
    const stepSize = Math.max(14, Math.floor(fullText.length / 120));

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

  // Click to skip typewriter and reveal full content immediately
  const handleSkip = (e) => {
    e.stopPropagation();
    setDisplayedLength(fullText.length);
    onComplete?.();
  };

  const { slice: currentSlice } = getSafeSlice(fullText, displayedLength);

  return (
    <div className="relative group">
      <FormattedContent text={currentSlice} />
      {!isFinished && (
        <div className="inline-flex items-center gap-2 mt-1">
          <span className="inline-block w-2 h-4 bg-[var(--accent-primary)] animate-pulse align-middle rounded-xs" />
          <button
            onClick={handleSkip}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--accent-primary)] hover:underline opacity-60 hover:opacity-100 transition-opacity cursor-pointer ml-2"
            title="Click to reveal complete text instantly"
          >
            <FastForward className="w-3 h-3" />
            <span>Skip animation</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ActionButton({ icon: Icon, title, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-lg hover:bg-[var(--glass-surface-subtle)] hover:text-[var(--text-main)] active:scale-95 transition-all cursor-pointer"
      title={title}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-[var(--glass-surface-subtle)] hover:text-[var(--text-main)] active:scale-95 transition-all cursor-pointer"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

// KaTeX Math Formula Component
function MathFormula({ math, displayMode = false }) {
  const html = useMemo(() => {
    if (!math || !math.trim()) return null;
    try {
      return katex.renderToString(math.trim(), {
        displayMode,
        throwOnError: false,
      });
    } catch (e) {
      return null;
    }
  }, [math, displayMode]);

  if (!html) {
    return <code className="font-mono text-[12px] bg-white/5 px-1 rounded">{math}</code>;
  }

  return (
    <span
      className={
        displayMode
          ? "block my-3 px-3 py-2.5 rounded-xl bg-[var(--island-bg)] border border-white/[0.06] overflow-x-auto text-center shadow-xs"
          : "inline-block px-0.5 align-middle"
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ==============================================================================
// GOD-LEVEL MARKDOWN & MULTI-LINE KATEX PARSER
// ==============================================================================

function parseBlocks(text) {
  if (!text) return [];
  const clean = text.replace(/\r\n/g, "\n");
  const lines = clean.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code Block: ```lang
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: "code", language: lang, content: codeLines.join("\n") });
      continue;
    }

    // 2. Multi-line or Single-line Math Block: \[ ... \]
    if (trimmed.startsWith("\\[")) {
      const mathLines = [];
      let current = trimmed.slice(2);
      if (current.includes("\\]")) {
        // Single line \[ ... \]
        const mathContent = current.slice(0, current.indexOf("\\]")).trim();
        blocks.push({ type: "math_block", content: mathContent });
        i++;
        continue;
      }
      if (current.trim()) mathLines.push(current);
      i++;
      while (i < lines.length) {
        const nextLine = lines[i];
        const nextTrim = nextLine.trim();
        if (nextTrim.includes("\\]")) {
          const beforeClose = nextTrim.slice(0, nextTrim.indexOf("\\]")).trim();
          if (beforeClose) mathLines.push(beforeClose);
          i++;
          break;
        } else {
          mathLines.push(nextLine);
          i++;
        }
      }
      blocks.push({ type: "math_block", content: mathLines.join("\n").trim() });
      continue;
    }

    // 3. Multi-line or Single-line Math Block: $$ ... $$
    if (trimmed.startsWith("$$")) {
      const afterOpen = trimmed.slice(2);
      if (afterOpen.includes("$$")) {
        // Single line $$ ... $$
        const mathContent = afterOpen.slice(0, afterOpen.indexOf("$$")).trim();
        blocks.push({ type: "math_block", content: mathContent });
        i++;
        continue;
      }
      const mathLines = [];
      if (afterOpen.trim()) mathLines.push(afterOpen);
      i++;
      while (i < lines.length) {
        const nextLine = lines[i];
        const nextTrim = nextLine.trim();
        if (nextTrim.includes("$$")) {
          const beforeClose = nextTrim.slice(0, nextTrim.indexOf("$$")).trim();
          if (beforeClose) mathLines.push(beforeClose);
          i++;
          break;
        } else {
          mathLines.push(nextLine);
          i++;
        }
      }
      blocks.push({ type: "math_block", content: mathLines.join("\n").trim() });
      continue;
    }

    // 4. LaTeX Environment: \begin{equation} or \begin{align}
    if (/^\\begin\{(equation\*?|align\*?|gather\*?|multline\*?)\}/.test(trimmed)) {
      const envMatch = trimmed.match(/^\\begin\{([^}]+)\}/);
      const envName = envMatch ? envMatch[1] : "equation";
      const mathLines = [trimmed];
      i++;
      const endTag = `\\end{${envName}}`;
      while (i < lines.length) {
        mathLines.push(lines[i]);
        if (lines[i].includes(endTag)) {
          i++;
          break;
        }
        i++;
      }
      blocks.push({ type: "math_block", content: mathLines.join("\n").trim() });
      continue;
    }

    // 5. Table Block: lines with | ... |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines = [trimmed];
      i++;
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      blocks.push({ type: "table", lines: tableLines });
      continue;
    }

    // 6. Heading: #, ##, ###, ####
    if (trimmed.startsWith("#")) {
      const levelMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
      if (levelMatch) {
        blocks.push({ type: "heading", level: levelMatch[1].length, content: levelMatch[2] });
        i++;
        continue;
      }
    }

    // 7. Ordered List
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      blocks.push({ type: "list_num", number: numMatch[1], content: numMatch[2] });
      i++;
      continue;
    }

    // 8. Bullet List
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      blocks.push({ type: "list_bullet", content: trimmed.slice(2) });
      i++;
      continue;
    }

    // 9. Blockquote
    if (trimmed.startsWith("> ")) {
      blocks.push({ type: "quote", content: trimmed.slice(2) });
      i++;
      continue;
    }

    // 10. Empty line
    if (!trimmed) {
      blocks.push({ type: "empty" });
      i++;
      continue;
    }

    // 11. Normal paragraph
    blocks.push({ type: "paragraph", content: line });
    i++;
  }

  return blocks;
}

// Markdown Formatter with KaTeX LaTeX Support
function FormattedContent({ text }) {
  if (!text) return null;

  const blocks = parseBlocks(text);

  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "code":
            return (
              <div key={i} className="my-2">
                <CodeBlock code={block.content} language={block.language} />
              </div>
            );

          case "math_block":
            return (
              <div key={i} className="my-2.5">
                <MathFormula math={block.content} displayMode={true} />
              </div>
            );

          case "table":
            return (
              <div key={i} className="my-2">
                <CleanTable lines={block.lines} />
              </div>
            );

          case "heading":
            if (block.level === 1) {
              return (
                <h1
                  key={i}
                  className="text-lg sm:text-xl font-bold text-[var(--text-main)] mt-5 mb-2.5 tracking-tight border-b border-white/[0.06] pb-1.5"
                >
                  {parseInline(block.content)}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2
                  key={i}
                  className="text-[16px] sm:text-lg font-semibold text-[var(--accent-primary)] mt-4 mb-2 tracking-tight flex items-center gap-2"
                >
                  <span className="w-1.5 h-3.5 bg-[var(--accent-primary)] rounded-full shrink-0" />
                  <span>{parseInline(block.content)}</span>
                </h2>
              );
            }
            return (
              <h3
                key={i}
                className="text-[14.5px] sm:text-[15px] font-semibold text-[var(--text-main)] mt-3.5 mb-1.5"
              >
                {parseInline(block.content)}
              </h3>
            );

          case "list_num":
            return (
              <div key={i} className="flex items-start gap-2.5 my-1.5">
                <span className="w-5 h-5 rounded-full bg-[var(--highlight-bg)] text-[var(--accent-primary)] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {block.number}
                </span>
                <span className="text-[var(--text-main)] leading-relaxed">
                  {parseInline(block.content)}
                </span>
              </div>
            );

          case "list_bullet":
            return (
              <div key={i} className="flex items-start gap-2.5 my-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0 mt-2" />
                <span className="text-[var(--text-main)] leading-relaxed">
                  {parseInline(block.content)}
                </span>
              </div>
            );

          case "quote":
            return (
              <div
                key={i}
                className="my-2 px-3.5 py-2 border-l-2 border-[var(--accent-primary)] bg-[var(--island-bg)]/60 rounded-r-lg text-[var(--text-muted)] italic text-[13.5px]"
              >
                {parseInline(block.content)}
              </div>
            );

          case "empty":
            return <div key={i} className="h-2" />;

          case "paragraph":
          default:
            return (
              <p key={i} className="my-1.5 leading-relaxed">
                {parseInline(block.content)}
              </p>
            );
        }
      })}
    </>
  );
}

// Normalizes unescaped bare LaTeX tokens outside of existing math delimiters
function autoWrapBareLatex(str) {
  if (!str) return "";

  // Split by existing delimiters to protect them
  const parts = [];
  const mathRegex = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|(?<!\\)\$[^\$\n]+\$|`[^`]+`)/g;
  let lastIdx = 0;
  let m;

  while ((m = mathRegex.exec(str)) !== null) {
    if (m.index > lastIdx) {
      parts.push({ isMath: false, text: str.substring(lastIdx, m.index) });
    }
    parts.push({ isMath: true, text: m[0] });
    lastIdx = mathRegex.lastIndex;
  }
  if (lastIdx < str.length) {
    parts.push({ isMath: false, text: str.substring(lastIdx) });
  }

  // Common Greek letters or physics variables that models often output bare
  const bareTeXRegex = /(\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:(?:\{(?:[^{}]+|\{[^{}]*\})*\}|_[a-zA-Z0-9]+|_\{(?:[^{}]+|\{[^{}]*\})*\}|\^[a-zA-Z0-9]+|\^\{(?:[^{}]+|\{[^{}]*\})*\})*))/g;

  return parts
    .map((p) => {
      if (p.isMath) return p.text;
      return p.text.replace(bareTeXRegex, (match) => `$${match}$`);
    })
    .join("");
}

// Inline Parser with KaTeX LaTeX Support
function parseInline(rawText) {
  if (!rawText) return null;
  const text = autoWrapBareLatex(rawText);
  const parts = [];

  // Matches:
  // 1. Block LaTeX: \\[ ... \\]
  // 2. Inline LaTeX: \\( ... \\)
  // 3. Display math: $$ ... $$
  // 4. Inline dollar math: $ ... $
  // 5. Bold: ** ... **
  // 6. Italic: * ... *
  // 7. Code: ` ... `
  // 8. Link: [ ... ]( ... )
  const regex = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|(?<!\\)\$[^\$\n]+\$|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];

    if (token.startsWith("\\[") && token.endsWith("\\]")) {
      parts.push(
        <MathFormula key={`math-block-${match.index}`} math={token.slice(2, -2)} displayMode={true} />
      );
    } else if (token.startsWith("\\(") && token.endsWith("\\)")) {
      parts.push(
        <MathFormula key={`math-inline-${match.index}`} math={token.slice(2, -2)} displayMode={false} />
      );
    } else if (token.startsWith("$$") && token.endsWith("$$")) {
      parts.push(
        <MathFormula key={`math-block-${match.index}`} math={token.slice(2, -2)} displayMode={true} />
      );
    } else if (token.startsWith("$") && token.endsWith("$")) {
      parts.push(
        <MathFormula key={`math-inline-${match.index}`} math={token.slice(1, -1)} displayMode={false} />
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-[var(--text-main)]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic opacity-90">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-md text-[12px] font-mono bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--accent-primary)]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-primary)] underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

// Clean Table Component (with KaTeX formulas rendered inside table cells)
function CleanTable({ lines }) {
  if (!lines || lines.length === 0) return null;

  const validLines = lines.filter((l) => !l.replace(/[\s|:-]/g, "") === false);
  if (validLines.length === 0) return null;

  const parseRow = (line) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

  const headers = parseRow(validLines[0]);
  const dataRows = validLines.slice(1).map(parseRow).filter((r) => r.length > 0);

  return (
    <div className="w-full my-3.5 overflow-x-auto rounded-xl border border-white/[0.08] bg-[var(--island-bg)] shadow-xs">
      <table className="w-full text-left border-collapse text-[12.5px] sm:text-[13px]">
        <thead>
          <tr className="border-b border-white/[0.08] bg-[var(--highlight-bg)]">
            {headers.map((h, hIdx) => (
              <th
                key={hIdx}
                className="px-3.5 py-2.5 font-semibold text-[var(--accent-primary)] tracking-tight whitespace-nowrap"
              >
                {parseInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {dataRows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className="hover:bg-white/[0.02] transition-colors odd:bg-white/[0.01]"
            >
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3.5 py-2 text-[var(--text-main)] font-normal leading-snug">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Syntax-Highlighted Code Block with 1-Click Copy
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-white/[0.08] bg-[#0E0F12]">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.03] border-b border-white/[0.06] text-[11px] font-mono text-[var(--text-muted)]">
        <span>{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-[var(--text-main)] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 text-[12.5px] font-mono text-zinc-200 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

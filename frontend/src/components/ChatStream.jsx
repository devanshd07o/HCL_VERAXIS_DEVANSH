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
  Layers
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

// Typewriter Streaming Component for Bot Responses
function TypewriterStreamContent({ fullText, onComplete }) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const isFinished = displayedLength >= fullText.length;

  useEffect(() => {
    if (!fullText) {
      onComplete?.();
      return;
    }

    // High speed streaming reveal: ~20-25 chars per tick (16ms)
    const chunkSize = Math.max(15, Math.floor(fullText.length / 150));
    const interval = setInterval(() => {
      setDisplayedLength((prev) => {
        const next = prev + chunkSize;
        if (next >= fullText.length) {
          clearInterval(interval);
          onComplete?.();
          return fullText.length;
        }
        return next;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [fullText, onComplete]);

  // Click to reveal full text immediately (skip animation)
  const handleSkip = () => {
    setDisplayedLength(fullText.length);
    onComplete?.();
  };

  const currentSlice = fullText.slice(0, displayedLength);

  return (
    <div onClick={handleSkip} title={!isFinished ? "Click to skip animation" : ""} className="relative cursor-pointer">
      <FormattedContent text={currentSlice} />
      {!isFinished && (
        <span className="inline-block w-1.5 h-4 ml-0.5 bg-[var(--accent-primary)] animate-pulse align-middle" />
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
      className={displayMode ? "block my-2 overflow-x-auto text-center py-1" : "inline-block px-0.5"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Markdown Formatter with KaTeX LaTeX Support
function FormattedContent({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const rendered = [];
  let inCode = false;
  let codeBuffer = [];
  let codeLang = "";
  let inTable = false;
  let tableBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code Fence
    if (trimmed.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLang = trimmed.replace("```", "").trim();
        codeBuffer = [];
      } else {
        inCode = false;
        rendered.push(
          <div key={`code-${i}`} className="my-2">
            <CodeBlock code={codeBuffer.join("\n")} language={codeLang} />
          </div>
        );
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Standalone LaTeX Block Math: \[ ... \] or $$ ... $$
    if (
      (trimmed.startsWith("\\[") && trimmed.endsWith("\\]")) ||
      (trimmed.startsWith("$$") && trimmed.endsWith("$$"))
    ) {
      const mathContent = trimmed.startsWith("\\[")
        ? trimmed.slice(2, -2)
        : trimmed.slice(2, -2);
      rendered.push(
        <div key={`math-block-${i}`} className="my-2.5 p-2 rounded-lg bg-[var(--island-bg)] border border-white/[0.05] overflow-x-auto">
          <MathFormula math={mathContent} displayMode={true} />
        </div>
      );
      continue;
    }

    // Markdown Table Detection
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableBuffer = [];
      }
      tableBuffer.push(trimmed);
      continue;
    } else if (inTable) {
      inTable = false;
      rendered.push(
        <div key={`table-${i}`} className="my-2">
          <CleanTable lines={tableBuffer} />
        </div>
      );
      tableBuffer = [];
    }

    // Headings
    if (trimmed.startsWith("# ")) {
      rendered.push(
        <h1
          key={i}
          className="text-lg sm:text-xl font-bold text-[var(--text-main)] mt-4 mb-2 tracking-tight"
        >
          {parseInline(trimmed.substring(2))}
        </h1>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      rendered.push(
        <h2
          key={i}
          className="text-[16px] sm:text-lg font-semibold text-[var(--accent-primary)] mt-3.5 mb-1.5 tracking-tight"
        >
          {parseInline(trimmed.substring(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith("### ")) {
      rendered.push(
        <h3
          key={i}
          className="text-[14.5px] sm:text-[15px] font-semibold text-[var(--text-main)] mt-3 mb-1"
        >
          {parseInline(trimmed.substring(4))}
        </h3>
      );
      continue;
    }

    // Numbered List
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      rendered.push(
        <div key={i} className="flex items-start gap-2.5 my-1.5">
          <span className="w-5 h-5 rounded-full bg-[var(--highlight-bg)] text-[var(--accent-primary)] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <span className="text-[var(--text-main)]">{parseInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Bullet List
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      rendered.push(
        <div key={i} className="flex items-start gap-2.5 my-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0 mt-2" />
          <span className="text-[var(--text-main)]">{parseInline(trimmed.substring(2))}</span>
        </div>
      );
      continue;
    }

    // Blank line
    if (!trimmed) {
      rendered.push(<div key={i} className="h-2" />);
      continue;
    }

    // Standard Paragraph
    rendered.push(
      <p key={i} className="my-1.5 leading-relaxed">
        {parseInline(line)}
      </p>
    );
  }

  // Flush trailing table
  if (inTable && tableBuffer.length > 0) {
    rendered.push(
      <div key="table-end" className="my-2">
        <CleanTable lines={tableBuffer} />
      </div>
    );
  }

  return <>{rendered}</>;
}

// Inline Parser with KaTeX LaTeX Support
function parseInline(text) {
  if (!text) return null;
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

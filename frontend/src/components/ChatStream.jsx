import React, { useState } from "react";
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
  return (
    <div className={`w-full ${widthClass} mx-auto px-2 sm:px-4 py-4 flex flex-col gap-7`}>
      {messages.map((msg, idx) => (
        <div key={idx} className="w-full flex flex-col gap-2">
          {msg.role === "user" ? (
            /* USER QUERY ROW (Image 2 Inspired: Avatar + Text + Clean Bubble) */
            <div className="flex items-start justify-end gap-3 max-w-[88%] ml-auto">
              <div className="flex flex-col items-end gap-1">
                <div className="px-5 py-3 rounded-2xl rounded-tr-xs bg-gradient-to-r from-[var(--accent-blue)] via-indigo-600 to-[var(--accent-cyan)] text-white text-[14px] sm:text-[15px] shadow-sm leading-relaxed font-normal">
                  {msg.content}
                </div>
                <span className="text-[10.5px] text-[var(--text-muted)] px-1 font-mono">You</span>
              </div>

              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs mt-0.5">
                DN
              </div>
            </div>
          ) : (
            /* BOT RESPONSE ROW (Image 2 + Perplexity + Claude Fusion) */
            <div className="w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[var(--island-bg)] backdrop-blur-2xl border border-[var(--island-border)] shadow-[var(--island-shadow)] text-[var(--text-main)] space-y-4.5">
              {/* Bot Identity Header (Image 2 style: CHAT A.I+) */}
              <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[var(--highlight-bg)] text-[var(--accent-cyan)] flex items-center justify-center border border-[var(--glass-border)]">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse-subtle" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[13.5px] sm:text-[14px] tracking-tight text-[var(--text-main)]">
                      VERAXIS A.I
                    </span>
                    <span className="text-[11px] font-bold text-[var(--accent-cyan)]">+</span>
                  </div>
                </div>

                {/* Right Research Badge */}
                {msg.type === "research" ? (
                  <button
                    onClick={() => onInspectResearch && onInspectResearch(msg)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold bg-[var(--highlight-bg)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 hover:bg-[var(--accent-cyan)]/20 active:scale-95 transition-all cursor-pointer shadow-xs"
                    title="Open live telemetry in Right Inspector"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>3-Agent Swarm</span>
                    <ChevronRight className="w-3 h-3 opacity-70" />
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-[var(--text-muted)] opacity-80">
                    Fast Inference &lt;400ms
                  </span>
                )}
              </div>

              {/* PERPLEXITY STYLE SOURCES GRID (If Deep Research) */}
              {msg.type === "research" && msg.sources && msg.sources.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                      <span>Indexed Empirical Sources ({msg.sources.length})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {msg.sources.slice(0, 3).map((s, sIdx) => (
                      <a
                        key={sIdx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-2.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] hover:border-[var(--accent-cyan)]/40 hover:bg-[var(--glass-border)]/50 transition-all flex flex-col justify-between gap-1.5"
                      >
                        <div className="flex items-center justify-between text-[10.5px] font-semibold text-[var(--accent-cyan)]">
                          <span className="px-1.5 py-0.5 rounded-md bg-[var(--chip-bg)] border border-[var(--chip-border)]">
                            [{sIdx + 1}] arXiv
                          </span>
                          <ExternalLink className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)] transition-colors" />
                        </div>
                        <div className="text-[12px] font-medium text-[var(--text-main)] line-clamp-2 leading-snug">
                          {s.title}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* CLAUDE EDITORIAL BODY (Pure Typography with Buttery Cascading Stream) */}
              <div className="text-[14.5px] sm:text-[15px] leading-relaxed text-[var(--text-main)]">
                <FormattedContent text={msg.content} />
              </div>

              {/* ACTION TOOLBAR (Image 2 Inspired: Thumbs, Copy, PDF Download) */}
              <div className="pt-3 border-t border-[var(--glass-border)] flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-1 text-[var(--text-muted)]">
                  <ActionButton icon={ThumbsUp} title="Good response" />
                  <ActionButton icon={ThumbsDown} title="Poor response" />
                  <CopyButton text={msg.content} />
                  {msg.type === "research" && (
                    <button
                      onClick={() => onInspectResearch && onInspectResearch(msg)}
                      className="ml-1 px-2.5 py-1 rounded-lg text-[11.5px] font-medium hover:bg-[var(--glass-surface-subtle)] hover:text-[var(--text-main)] transition-colors flex items-center gap-1.5"
                    >
                      <Layers className="w-3 h-3 text-[var(--accent-cyan)]" />
                      <span>Inspect Telemetry</span>
                    </button>
                  )}
                </div>

                {/* 1-Click ReportLab 4.x PDF Download Pill */}
                {msg.pdf_filename && (
                  <a
                    href={`/api/download-pdf/${encodeURIComponent(msg.pdf_filename)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] text-white text-[12px] font-semibold hover:opacity-90 active:scale-95 shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Dossier</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Shimmer Indicator during Processing */}
      {isLoading && (
        <div className="w-full flex items-start">
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--island-bg)] backdrop-blur-2xl border border-[var(--island-border)] shadow-sm flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-[var(--highlight-bg)] text-[var(--accent-cyan)] flex items-center justify-center animate-spin">
              <RotateCw className="w-3.5 h-3.5" />
            </div>
            <span
              className="t-shimmer text-[13.5px] sm:text-[14px] font-medium"
              data-text="Mobilizing 3-Tier Multi-Agent Swarm (Analyst ➔ Auditor ➔ Director)..."
            >
              Mobilizing 3-Tier Multi-Agent Swarm (Analyst ➔ Auditor ➔ Director)...
            </span>
          </div>
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

// Markdown Formatter with Claude Editorial Feel & Zero Raw Pipes
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
    const delayStyle = { animationDelay: `${Math.min(i * 30, 800)}ms` };

    // Code Fence
    if (trimmed.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLang = trimmed.replace("```", "").trim();
        codeBuffer = [];
      } else {
        inCode = false;
        rendered.push(
          <div key={`code-${i}`} className="buttery-line" style={delayStyle}>
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
        <div key={`table-${i}`} className="buttery-line" style={delayStyle}>
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
          className="buttery-line text-lg sm:text-xl font-bold text-[var(--text-main)] mt-4 mb-2 tracking-tight"
          style={delayStyle}
        >
          {trimmed.substring(2)}
        </h1>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      rendered.push(
        <h2
          key={i}
          className="buttery-line text-[16px] sm:text-lg font-semibold text-[var(--accent-cyan)] mt-3.5 mb-1.5 tracking-tight"
          style={delayStyle}
        >
          {trimmed.substring(3)}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith("### ")) {
      rendered.push(
        <h3
          key={i}
          className="buttery-line text-[14.5px] sm:text-[15px] font-semibold text-[var(--text-main)] mt-3 mb-1"
          style={delayStyle}
        >
          {trimmed.substring(4)}
        </h3>
      );
      continue;
    }

    // Numbered List (Image 2 style: 1. Install..., 2. Load...)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      rendered.push(
        <div key={i} className="buttery-line flex items-start gap-2.5 my-1.5" style={delayStyle}>
          <span className="w-5 h-5 rounded-full bg-[var(--highlight-bg)] text-[var(--accent-cyan)] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
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
        <div key={i} className="buttery-line flex items-start gap-2.5 my-1" style={delayStyle}>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] shrink-0 mt-2" />
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
      <p key={i} className="buttery-line my-1.5 leading-relaxed" style={delayStyle}>
        {parseInline(line)}
      </p>
    );
  }

  // Flush trailing table
  if (inTable && tableBuffer.length > 0) {
    rendered.push(
      <div key="table-end" className="buttery-line">
        <CleanTable lines={tableBuffer} />
      </div>
    );
  }

  return <>{rendered}</>;
}

// Inline Parser
function parseInline(text) {
  if (!text) return null;
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
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
          className="px-1.5 py-0.5 rounded-md text-[12px] font-mono bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--accent-cyan)]"
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
            className="text-[var(--accent-cyan)] underline underline-offset-2 hover:opacity-80 transition-opacity"
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

// Clean Table Component (Pure Abstract Design - Zero Raw Symbols)
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
    <div className="w-full my-3.5 overflow-x-auto rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-subtle)] shadow-xs">
      <table className="w-full text-left border-collapse text-[12.5px] sm:text-[13px]">
        <thead>
          <tr className="border-b border-[var(--glass-border)] bg-[var(--highlight-bg)]">
            {headers.map((h, hIdx) => (
              <th
                key={hIdx}
                className="px-3.5 py-2.5 font-semibold text-[var(--accent-cyan)] tracking-tight whitespace-nowrap"
              >
                {parseInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--glass-border)]">
          {dataRows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className="hover:bg-[var(--glass-border)]/40 transition-colors odd:bg-white/[0.01]"
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
    <div className="relative my-3 rounded-xl border border-[var(--glass-border)] bg-[#0A0E17] overflow-hidden text-[12.5px]">
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-white/10 bg-white/5 text-[11px] text-[var(--text-muted)] font-mono">
        <span>{language || "text"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto font-mono text-[#E2E8F0] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

import React, { useState } from "react";
import { Download, FileText, Globe, Search, ShieldCheck, Check, Copy, Sparkles, ChevronRight } from "lucide-react";

export default function ChatStream({
  messages,
  isLoading,
  widthClass = "max-w-[940px]",
  onInspectResearch,
}) {
  return (
    <div className={`w-full ${widthClass} mx-auto px-3 sm:px-4 py-4 flex flex-col gap-6`}>
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex flex-col ${
            msg.role === "user" ? "items-end" : "items-start w-full"
          }`}
        >
          {msg.role === "user" ? (
            <div className="max-w-[85%] px-5 py-3 rounded-2xl bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] text-white text-[14.5px] sm:text-[15px] shadow-sm leading-relaxed">
              {msg.content}
            </div>
          ) : (
            <div className="w-full p-4 sm:p-6 rounded-2xl bg-[var(--glass-surface)] backdrop-blur-xl border border-[var(--glass-border)] shadow-sm text-[var(--text-main)] space-y-4">
              {/* Dynamic Research Telemetry Accordion */}
              {msg.type === "research" && (
                <div className="p-3.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] space-y-2.5 text-[12.5px] sm:text-[13px]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] pb-2">
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-[var(--accent-cyan)] shrink-0" />
                      <span>
                        <b>Topic:</b> <span className="opacity-90">{msg.topic}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => onInspectResearch && onInspectResearch(msg)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-semibold bg-[var(--highlight-bg)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 hover:bg-[var(--accent-cyan)]/20 active:scale-95 transition-all cursor-pointer shadow-xs"
                      title="Open in Right Inspector Drawer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Inspect Agent Intel</span>
                      <ChevronRight className="w-3 h-3 opacity-70" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      <b>Indexed Sources:</b>{" "}
                      <span className="font-medium">
                        {msg.sources?.length || 0} authoritative preprints & web feeds
                      </span>
                    </span>
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.sources.map((s, sIdx) => (
                        <a
                          key={sIdx}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] bg-[var(--chip-bg)] border border-[var(--chip-border)] text-[var(--accent-cyan)] hover:bg-[var(--chip-hover-bg)] transition-all truncate max-w-[220px]"
                        >
                          <FileText className="w-3 h-3 shrink-0" />
                          <span className="truncate">{s.title || s.url}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Cross-verified with zero-hallucination forensic auditor</span>
                  </div>
                </div>
              )}

              {/* Main Content with Buttery Cascading Line Flow & Pure Table Abstraction */}
              <div className="text-[14.5px] sm:text-[15px] leading-relaxed">
                <FormattedContent text={msg.content} />
              </div>

              {/* ReportLab 4.x PDF Download Action Card */}
              {msg.pdf_filename && (
                <div className="mt-3 p-3.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <div className="font-semibold text-[13.5px] sm:text-[14px] text-[var(--text-main)] flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[var(--accent-cyan)]" />
                      <span>Executive Research Dossier (PDF)</span>
                    </div>
                    <div className="text-[11.5px] text-[var(--text-muted)] mt-0.5">
                      Two-pass vector publication format with McKinsey/Gartner layout
                    </div>
                  </div>

                  <a
                    href={`/api/download-pdf/${encodeURIComponent(msg.pdf_filename)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] text-white text-[12.5px] sm:text-[13px] font-medium hover:opacity-90 active:scale-95 shadow-sm transition-all shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Shimmer Indicator during Processing */}
      {isLoading && (
        <div className="flex items-start w-full">
          <div className="p-4 rounded-2xl bg-[var(--glass-surface)] backdrop-blur-xl border border-[var(--glass-border)] shadow-sm">
            <span
              className="t-shimmer text-[14px] font-medium"
              data-text="Evaluating query intent & multi-agent routing..."
            >
              Evaluating query intent & multi-agent routing...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Markdown Formatter with Buttery Cascading Line Flow
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
    const delayStyle = { animationDelay: `${Math.min(i * 35, 900)}ms` };

    // 1. Code Fence
    if (trimmed.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLang = trimmed.replace("```", "").trim();
        codeBuffer = [];
      } else {
        inCode = false;
        rendered.push(
          <div key={`code-${i}`} className="buttery-line" style={delayStyle}>
            <CodeBlock
              code={codeBuffer.join("\n")}
              language={codeLang}
            />
          </div>
        );
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // 2. Markdown Table Detection
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

    // 3. Headings
    if (trimmed.startsWith("# ")) {
      rendered.push(
        <h1
          key={i}
          className="buttery-line text-lg sm:text-xl font-bold text-[var(--text-main)] mt-3.5 mb-1.5 tracking-tight"
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
          className="buttery-line text-[16px] sm:text-lg font-semibold text-[var(--accent-cyan)] mt-3 mb-1 tracking-tight"
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
          className="buttery-line text-[14.5px] sm:text-[15px] font-semibold text-[var(--text-main)] mt-2 mb-1"
          style={delayStyle}
        >
          {trimmed.substring(4)}
        </h3>
      );
      continue;
    }

    // 4. Bullet lists
    if (/^[\-\*]\s+/.test(trimmed)) {
      rendered.push(
        <div key={i} className="buttery-line flex items-start gap-2 my-1 ml-2" style={delayStyle}>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] mt-2 shrink-0" />
          <span className="flex-1 text-[14px] sm:text-[14.5px] leading-relaxed">
            {parseInline(trimmed.replace(/^[\-\*]\s+/, ""))}
          </span>
        </div>
      );
      continue;
    }

    // 5. Empty spacer
    if (!trimmed) {
      rendered.push(<div key={i} className="h-1" />);
      continue;
    }

    // 6. Paragraph
    rendered.push(
      <p key={i} className="buttery-line my-1.5 text-[14px] sm:text-[14.5px] leading-relaxed" style={delayStyle}>
        {parseInline(trimmed)}
      </p>
    );
  }

  // Flush trailing table
  if (inTable && tableBuffer.length > 0) {
    rendered.push(
      <div key={`table-end`} className="buttery-line" style={{ animationDelay: `${Math.min(lines.length * 35, 900)}ms` }}>
        <CleanTable lines={tableBuffer} />
      </div>
    );
  }

  return <div className="space-y-1">{rendered}</div>;
}

// Pure Abstract Executive Table (Clean Swiss layout, zero emoji clutter)
function CleanTable({ lines }) {
  if (!lines || lines.length < 2) return null;

  const validRows = lines
    .map((line) =>
      line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim())
    )
    .filter((row) => !row.every((cell) => /^[\s\-:]+$/.test(cell)));

  if (validRows.length === 0) return null;

  const headers = validRows[0];
  const rows = validRows.slice(1);

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[var(--glass-border)] bg-[var(--glass-surface-subtle)] shadow-sm">
      <div className="overflow-x-auto stage-scroll-container">
        <table className="w-full border-collapse text-[13px] sm:text-[13.5px] text-left">
          <thead>
            <tr className="border-b border-[var(--glass-border)] bg-[rgba(255,255,255,0.03)]">
              {headers.map((h, hIdx) => (
                <th
                  key={hIdx}
                  className="px-3.5 py-2 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)]"
                >
                  {parseInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--glass-border)]">
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              >
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2.5 leading-relaxed text-[var(--text-main)]">
                    {parseInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function parseInline(str) {
  if (!str) return "";
  const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-semibold text-[var(--text-main)]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--accent-cyan)] font-mono text-[12px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl bg-black/40 border border-[var(--glass-border)] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.03] border-b border-[var(--glass-border)] text-[11px]">
        <span className="font-mono uppercase font-semibold text-[var(--accent-cyan)]">
          {language || "CODE"}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] hover:bg-[var(--glass-border)] transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[12.5px] sm:text-[13px] font-mono text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

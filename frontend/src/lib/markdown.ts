import { marked, Renderer } from "marked";
import katex from "katex";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";
import "prismjs/components/prism-css";

/** Language alias map for Prism syntax resolution */
const LANG_ALIASES: Record<string, string> = {
  py: "python",
  python3: "python",
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  terminal: "bash",
  yml: "yaml",
  md: "markdown",
  golang: "go",
  rs: "rust",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 48);
}

const CALLOUT_ICONS: Record<string, string> = {
  NOTE: `<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  INFO: `<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  TIP: `<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  SUCCESS: `<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`,
  IMPORTANT: `<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  KEY: `<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  WARNING: `<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  CAUTION: `<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  DANGER: `<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

/** Create and configure Supreme Marked custom renderer */
function createSupremeRenderer(): Renderer {
  const r = new Renderer();
  const origTable = r.table.bind(r);

  // 1. Fenced Code Blocks with Language Badge & Copy Button
  r.code = function ({ text, lang }) {
    const rawLang = (lang || "").trim().toLowerCase();
    const resolvedLang = LANG_ALIASES[rawLang] || rawLang || "text";
    const grammar = Prism.languages[resolvedLang] || Prism.languages.text;
    let highlighted: string;

    try {
      highlighted = Prism.highlight(text, grammar, resolvedLang);
    } catch {
      highlighted = escapeHtml(text);
    }

    const displayLang = (rawLang || "code").toUpperCase();
    const encoded = encodeURIComponent(text);

    return `<div class="uv-code-card not-prose my-4 rounded-xl border border-border bg-[#090B10] shadow-sm overflow-hidden">
      <div class="uv-code-header flex items-center justify-between border-b border-border/80 bg-[#121620] px-3.5 py-1.5 text-xs">
        <div class="flex items-center gap-2">
          <span class="size-2 rounded-full bg-primary/80"></span>
          <span class="font-mono-tech font-semibold tracking-wider text-primary text-[11px]">${displayLang}</span>
        </div>
        <button
          type="button"
          class="uv-code-copy-btn flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 font-mono-tech text-[11px] font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
          data-code="${encoded}"
          aria-label="Copy code block"
        >
          <svg class="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <span>Copy</span>
        </button>
      </div>
      <div class="uv-code-scroll relative overflow-x-auto p-4 text-[13px] leading-relaxed">
        <pre class="m-0 font-mono"><code class="language-${resolvedLang}">${highlighted}</code></pre>
      </div>
    </div>`;
  };

  // 2. Headings with Anchors & Badges
  r.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const plainText = text.replace(/<[^>]+>/g, "");
    const id = slugify(plainText);

    if (depth === 1) {
      return `<h1 class="uv-h1 font-bold text-foreground" id="${id}">
        <span class="uv-h1-text">${text}</span>
      </h1>`;
    }
    if (depth === 2) {
      return `<h2 class="uv-h2 font-semibold text-foreground" id="${id}">
        <span class="uv-h2-text">${text}</span>
      </h2>`;
    }
    if (depth === 3) {
      return `<h3 class="uv-h3 font-semibold text-foreground" id="${id}">
        <span>${text}</span>
      </h3>`;
    }
    return `<h${depth} class="font-semibold text-foreground" id="${id}">${text}</h${depth}>`;
  };

  // 3. Tables in Responsive Luxury Card Wrappers
  r.table = function (token) {
    const rawTable = origTable(token);
    return `<div class="uv-table-wrapper not-prose my-4">
      <div class="uv-table-scroll overflow-x-auto">
        ${rawTable}
      </div>
    </div>`;
  };

  // 4. GitHub-Style Callout Blocks & Quotes
  r.blockquote = function (token) {
    const raw = token.text || "";
    const match = raw.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO|KEY|DANGER|SUCCESS)\]\s*([\s\S]*)$/i);

    if (match) {
      const type = match[1].toUpperCase();
      const rest = match[2];
      const icon = CALLOUT_ICONS[type] || CALLOUT_ICONS.NOTE;
      const parsedBody = marked.parse(rest.trim());

      return `<aside class="uv-callout uv-callout-${type.toLowerCase()} not-prose my-4 rounded-xl border p-3.5 shadow-sm" data-callout="${type}">
        <div class="uv-callout-header flex items-center gap-2 font-mono-tech text-xs font-bold tracking-wider uppercase mb-1.5">
          <span class="uv-callout-icon">${icon}</span>
          <span>${type}</span>
        </div>
        <div class="uv-callout-body text-sm leading-relaxed text-foreground/90">
          ${parsedBody}
        </div>
      </aside>`;
    }

    const body = this.parser.parse(token.tokens);
    return `<blockquote class="uv-quote my-4 border-l-2 border-primary/60 bg-muted/20 py-2 px-3.5 rounded-r-xl italic text-foreground/85">
      ${body}
    </blockquote>`;
  };

  // 5. Interactive Checkboxes & Task Lists
  r.checkbox = function ({ checked }) {
    if (checked) {
      return `<span class="uv-task-check is-checked inline-flex size-4 shrink-0 items-center justify-center rounded border border-emerald-500/80 bg-emerald-500/20 text-emerald-400 mr-2 align-middle">
        <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </span>`;
    }
    return `<span class="uv-task-check is-unchecked inline-flex size-4 shrink-0 items-center justify-center rounded border border-border bg-card mr-2 align-middle"></span>`;
  };

  // 6. Inline Code Chips
  r.codespan = function ({ text }) {
    return `<code class="uv-inline-code inline-block rounded-md border border-border/80 bg-muted/40 px-1.5 py-0.5 font-mono text-[0.88em] text-primary tabular-nums">${text}</code>`;
  };

  // 7. Links with External Arrows & Clickable Citations
  r.link = function (token) {
    const href = token.href;
    const title = token.title;
    const text = token.tokens ? this.parser.parseInline(token.tokens) : (token.text || "");

    // If it's a numeric citation like [1] or [2]
    if (/^\[\d+\]$/.test(text.trim())) {
      const citeNum = text.replace(/\D/g, "");
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="citation-pill" data-cite="${citeNum}" title="${title || `Source [${citeNum}]`}">${citeNum}</a>`;
    }

    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr} class="uv-link inline-flex items-center gap-0.5 text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary font-medium transition-colors">
      <span>${text}</span>
      <svg class="size-3 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
    </a>`;
  };

  // 8. Horizontal Rules
  r.hr = function () {
    return `<div class="uv-hr my-6 flex items-center gap-3">
      <div class="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border"></div>
      <span class="font-mono-tech text-xs text-primary/60">◆</span>
      <div class="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border"></div>
    </div>`;
  };

  // 9. Plain Text Citations: [1], [2], etc. (Clean Academic Superscript)
  r.text = function (token) {
    if ("tokens" in token && token.tokens) {
      return this.parser.parseInline(token.tokens);
    }
    const raw = token.escaped ? token.text : (token.text || "");
    return raw.replace(
      /\[(\d{1,2})\]/g,
      '<a href="#ref-$1" class="citation-pill" data-cite="$1" title="Source [$1]">$1</a>'
    );
  };

  return r;
}

const supremeRenderer = createSupremeRenderer();

function stabilizePartialMarkdown(partial: string): string {
  if (!partial) return "";
  let text = partial;
  // If unclosed code fence
  const fenceMatches = text.match(/```/g);
  if (fenceMatches && fenceMatches.length % 2 !== 0) {
    text = `${text}\n\`\`\``;
  }
  return text;
}

/**
 * Normalizes fragmented markdown links where models put spaces or newlines
 * between brackets and parentheses: e.g. [Title] (url) or [Title]\n(url)
 */
export function normalizeMarkdownLinks(raw: string): string {
  if (!raw) return "";
  let text = raw
    // Heal [Title] (url) or [Title]\n(url) into [Title](url)
    .replace(/\[([^\]\n]+)\]\s*\n?\s*\((https?:\/\/[^\s)]+?)\)/g, "[$1]($2)")
    // Ensure bare DOI or URL in parentheses after brackets is joined
    .replace(/\[([^\]\n]+)\]\s*\((10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\)/g, "[$1](https://doi.org/$2)");

  // Tighten typography around numeric citation tags:
  // e.g. "biases [1] ." -> "biases [1]." (no awkward gap before period)
  text = text.replace(/\s*(\[\d{1,2}\])\s*([.,;:!?])/g, "$1$2");
  // e.g. "[9] [10]" -> "[9][10]" (adjacent citations sit snugly together)
  text = text.replace(/(\[\d{1,2}\])\s+(\[\d{1,2}\])/g, "$1$2");

  return text;
}

export function renderMarkdownWithKaTeX(
  rawText: string,
  isPartial = false
): string {
  if (!rawText) return "";

  const placeholders: string[] = [];
  const saveBlock = (html: string) => {
    const id = `KATEXPLACEHOLDER${placeholders.length}ENDTOKEN`;
    placeholders.push(html);
    return id;
  };

  let text = isPartial ? stabilizePartialMarkdown(rawText) : rawText;
  // Normalize Unicode bullet points at line starts into standard markdown list dashes
  text = text.replace(/^([ \t]*)[•●▪]\s+/gm, "$1- ");
  text = normalizeMarkdownLinks(text);

  // 1. Display KaTeX: \[ ... \] (Clean LaTeX presentation blending with background, NO formula label)
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) => {
    try {
      return saveBlock(
        `<div class="not-prose my-5 py-2 text-center overflow-x-auto text-foreground">
          <div class="katex-display">${katex.renderToString(math.trim(), {
            displayMode: true,
            throwOnError: false,
          })}</div>
        </div>`
      );
    } catch {
      return saveBlock(`<pre class="text-xs font-mono">${escapeHtml(math)}</pre>`);
    }
  });

  // 2. Display KaTeX: $$ ... $$ (Clean LaTeX presentation blending with background, NO formula label)
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math: string) => {
    try {
      return saveBlock(
        `<div class="not-prose my-5 py-2 text-center overflow-x-auto text-foreground">
          <div class="katex-display">${katex.renderToString(math.trim(), {
            displayMode: true,
            throwOnError: false,
          })}</div>
        </div>`
      );
    } catch {
      return saveBlock(`<pre class="text-xs font-mono">${escapeHtml(math)}</pre>`);
    }
  });

  // 3. Inline KaTeX: \( ... \)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) => {
    try {
      return saveBlock(
        `<span class="inline-math px-1">${katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        })}</span>`
      );
    } catch {
      return saveBlock(`<span class="text-xs font-mono">${escapeHtml(math)}</span>`);
    }
  });

  // 4. Inline KaTeX: $ ... $
  text = text.replace(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g, (_, math: string) => {
    try {
      return saveBlock(
        `<span class="inline-math px-1">${katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        })}</span>`
      );
    } catch {
      return saveBlock(`<span class="text-xs font-mono">${escapeHtml(math)}</span>`);
    }
  });

  // 5. Common scientific symbols
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
    .replace(/\\sigma\b/g, "σ")
    .replace(/\\phi\b/g, "ϕ")
    .replace(/\\mu\b/g, "μ")
    .replace(/\\alpha\b/g, "α")
    .replace(/\\beta\b/g, "β")
    .replace(/\\gamma\b/g, "γ")
    .replace(/\\Omega\b/g, "Ω")
    .replace(/\\Delta\b/g, "Δ")
    .replace(/\\nabla\b/g, "∇")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\partial\b/g, "∂");

  let compiled = marked.parse(text, {
    breaks: true,
    gfm: true,
    renderer: supremeRenderer,
  }) as string;

  placeholders.forEach((html, i) => {
    compiled = compiled.replace(`KATEXPLACEHOLDER${i}ENDTOKEN`, html);
  });

  return compiled;
}

export function injectTypewriterFrontier(htmlString: string): string {
  if (!htmlString) return "";
  const cursorHtml = `<span class="typewriter-cursor" aria-hidden="true"></span>`;
  const lastPClose = htmlString.lastIndexOf("</p>");
  if (lastPClose !== -1 && lastPClose > htmlString.length - 40) {
    return (
      htmlString.slice(0, lastPClose) +
      cursorHtml +
      htmlString.slice(lastPClose)
    );
  }
  return `${htmlString}${cursorHtml}`;
}

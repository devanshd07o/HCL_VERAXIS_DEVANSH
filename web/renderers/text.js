/**
 * VERAXIS AI — Modular Text & Rich Markdown Renderer
 * Handles highlighted text, italics, bold, callouts, citations, and orchestrates code/table renderers.
 */

(function (window) {
  function renderInline(text) {
    if (!text) return "";

    return text
      // Bold **text**
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      // Italic *text*
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      // Highlighted ==text==
      .replace(/==(.*?)==/g, '<mark class="refractive-highlight">$1</mark>')
      // Inline `code`
      .replace(/`([^`]+)`/g, '<code class="inline-code-pill">$1</code>')
      // Citation references [1], [2], [ArXiv:...]
      .replace(/\[(\d+|ArXiv:[^\]]+)\]/g, '<span class="citation-tag">[$1]</span>');
  }

  function renderFullMarkdown(rawText) {
    if (!rawText) return "";

    const lines = rawText.split("\n");
    const outputHtml = [];

    let inCodeBlock = false;
    let codeBuffer = [];
    let codeLanguage = "";

    let inTable = false;
    let tableBuffer = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Code Fence Detection (```lang)
      if (trimmed.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = trimmed.replace("```", "").trim();
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          if (window.VeraxisCodeRenderer) {
            outputHtml.push(window.VeraxisCodeRenderer.render(codeBuffer.join("\n"), codeLanguage));
          } else {
            outputHtml.push(`<pre><code>${codeBuffer.join("\n")}</code></pre>`);
          }
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // 2. Table Detection (| col | col |)
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        inTable = true;
        tableBuffer.push(trimmed);
        continue;
      } else if (inTable) {
        inTable = false;
        if (window.VeraxisTableRenderer) {
          outputHtml.push(window.VeraxisTableRenderer.render(tableBuffer));
        }
        tableBuffer = [];
      }

      // 3. Headings
      if (trimmed.startsWith("# ")) {
        outputHtml.push(`<h1 class="heading-gradient-1">${renderInline(trimmed.substring(2))}</h1>`);
        continue;
      }
      if (trimmed.startsWith("## ")) {
        outputHtml.push(`<h2 class="heading-gradient-2">${renderInline(trimmed.substring(3))}</h2>`);
        continue;
      }
      if (trimmed.startsWith("### ")) {
        outputHtml.push(`<h3 class="heading-gradient-3">${renderInline(trimmed.substring(4))}</h3>`);
        continue;
      }

      // 4. Callout Blocks (> [!NOTE] or > ...)
      if (trimmed.startsWith(">")) {
        const calloutContent = trimmed.replace(/^>\s*/, "");
        outputHtml.push(`
          <div class="glass-callout-card thick-glass-clay">
            <span class="callout-icon">💡</span>
            <div>${renderInline(calloutContent)}</div>
          </div>
        `);
        continue;
      }

      // 5. Bullet Lists (- item or * item)
      if (/^[\-\*]\s+/.test(trimmed)) {
        const itemText = trimmed.replace(/^[\-\*]\s+/, "");
        outputHtml.push(`<div class="rich-list-item"><span class="list-bullet-dot"></span><span>${renderInline(itemText)}</span></div>`);
        continue;
      }

      // 6. Empty Line
      if (!trimmed) {
        outputHtml.push('<div class="spacer-block"></div>');
        continue;
      }

      // 7. Regular Paragraph
      outputHtml.push(`<p class="rich-paragraph">${renderInline(trimmed)}</p>`);
    }

    // Flush trailing table
    if (inTable && tableBuffer.length && window.VeraxisTableRenderer) {
      outputHtml.push(window.VeraxisTableRenderer.render(tableBuffer));
    }

    return outputHtml.join("");
  }

  window.VeraxisTextRenderer = {
    renderInline: renderInline,
    render: renderFullMarkdown
  };
})(window);

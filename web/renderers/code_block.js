/**
 * VERAXIS AI — Modular Code Block Renderer
 * Renders syntax-aware, copyable code blocks with thick refractive glassmorphic clay styling.
 */

(function (window) {
  function renderCodeBlock(code, language = "code") {
    const cleanLang = language.trim() || "code";
    const escapedCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const blockId = "code-" + Math.random().toString(36).substring(2, 9);

    return `
    <div class="code-block-card thick-glass-clay" id="${blockId}">
      <div class="code-block-header">
        <div class="code-lang-pill">
          <span class="code-dot"></span>
          <span>${cleanLang.toUpperCase()}</span>
        </div>
        <button class="copy-code-btn" onclick="window.copyCodeSnippet('${blockId}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span class="copy-label">Copy</span>
        </button>
      </div>
      <div class="code-block-body">
        <pre><code class="language-${cleanLang}">${escapedCode}</code></pre>
      </div>
    </div>
    `;
  }

  window.copyCodeSnippet = function (blockId) {
    const container = document.getElementById(blockId);
    if (!container) return;
    const code = container.querySelector("code");
    if (!code) return;

    navigator.clipboard.writeText(code.innerText).then(() => {
      const btn = container.querySelector(".copy-code-btn");
      const label = container.querySelector(".copy-label");
      if (label) label.textContent = "Copied! ✔";
      if (btn) btn.classList.add("copied");
      setTimeout(() => {
        if (label) label.textContent = "Copy";
        if (btn) btn.classList.remove("copied");
      }, 2000);
    });
  };

  window.VeraxisCodeRenderer = {
    render: renderCodeBlock
  };
})(window);

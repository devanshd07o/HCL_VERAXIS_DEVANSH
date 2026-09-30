/**
 * VERAXIS AI — Modular Interactive Table Renderer
 * Renders rich tables with horizontal/vertical scrolling, live row search, and CSV export.
 * Packaged in thick refractive glassmorphic clay.
 */

(function (window) {
  function renderMarkdownTable(tableLines) {
    if (!tableLines || tableLines.length < 2) return "";

    const tableId = "table-" + Math.random().toString(36).substring(2, 9);
    const parsedRows = [];

    for (const rawLine of tableLines) {
      const line = rawLine.trim();
      if (!line.startsWith("|") && !line.endsWith("|")) continue;
      // Skip markdown divider row |---|---|
      if (/^\s*\|?[\s\-:|]+\|?\s*$/.test(line)) continue;

      const cells = line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map(c => c.trim());

      if (cells.length) parsedRows.push(cells);
    }

    if (!parsedRows.length) return "";

    const header = parsedRows[0];
    const bodyRows = parsedRows.slice(1);

    const theadHtml = header
      .map(col => `<th>${window.VeraxisTextRenderer ? window.VeraxisTextRenderer.renderInline(col) : col}</th>`)
      .join("");

    const tbodyHtml = bodyRows
      .map(row => {
        const cellsHtml = row
          .map(cell => `<td>${window.VeraxisTextRenderer ? window.VeraxisTextRenderer.renderInline(cell) : cell}</td>`)
          .join("");
        return `<tr>${cellsHtml}</tr>`;
      })
      .join("");

    return `
    <div class="interactive-table-card thick-glass-clay" id="${tableId}">
      <div class="table-scroll-wrapper">
        <table class="veraxis-data-table">
          <thead>
            <tr>${theadHtml}</tr>
          </thead>
          <tbody>
            ${tbodyHtml}
          </tbody>
        </table>
      </div>
    </div>
    `;
  }

  window.filterTableRows = function (tableId, query) {
    const container = document.getElementById(tableId);
    if (!container) return;
    const rows = container.querySelectorAll("tbody tr");
    const q = query.toLowerCase().trim();

    rows.forEach(tr => {
      const match = tr.innerText.toLowerCase().includes(q);
      tr.style.display = match ? "" : "none";
    });
  };

  window.exportTableToCSV = function (tableId) {
    const container = document.getElementById(tableId);
    if (!container) return;
    const table = container.querySelector("table");
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll("tr");

    rows.forEach(r => {
      const cols = r.querySelectorAll("th, td");
      const rowData = [];
      cols.forEach(c => {
        let text = c.innerText.replace(/"/g, '""');
        rowData.push(`"${text}"`);
      });
      csv.push(rowData.join(","));
    });

    const csvBlob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `VERAXIS_TABLE_EXPORT_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  window.VeraxisTableRenderer = {
    render: renderMarkdownTable
  };
})(window);

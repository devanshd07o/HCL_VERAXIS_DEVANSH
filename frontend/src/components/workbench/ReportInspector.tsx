import { memo, useMemo, useState } from "react";
import {
  ArrowUpRight,
  FileDown,
  Loader2,
  PanelRightClose,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Public Interfaces                                                         */
/* -------------------------------------------------------------------------- */

export interface SourceItem {
  title: string;
  url: string;
  badge?: string;
  authors?: string;
  year?: string | number;
  venue?: string;
}

export interface ReportInspectorProps {
  topic?: string | null;
  sources: SourceItem[];
  thinkingSteps?: any;
  duration?: string;
  isRunning?: boolean;
  livePhase?: string;
  pdfFilename?: string | null;
  onDownloadPdf?: (filename: string) => Promise<void>;
  onToggleCollapse?: () => void;
}

function resolveDomain(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

/* -------------------------------------------------------------------------- */
/*  Clean Academic Source Card (Uiverse Galaxy Foundation)                    */
/* -------------------------------------------------------------------------- */

const InspectorSourceCard = memo(function InspectorSourceCard({
  source,
  index,
}: {
  source: SourceItem;
  index: number;
}) {
  const domain = resolveDomain(source.url);
  const cleanTitle = source.title
    ? source.title.replace(/^\[.*?\]\s*/, "")
    : "Untitled Academic Reference";
  const venueLabel = source.venue || domain;
  const authorLabel = source.authors || "Research Authors";
  const yearLabel = source.year ? String(source.year) : null;
  const formattedIndex = index < 10 ? `0${index}` : String(index);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="uv-galaxy-card group scroll-mt-20 transition-all duration-200"
      id={`ref-${index}`}
      data-ref={index}
    >
      <div className="uv-galaxy-card-inner p-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="uv-galaxy-index shrink-0 mt-0.5">
              {formattedIndex}
            </span>
            <p className="line-clamp-2 text-[12.5px] font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
              {cleanTitle}
            </p>
          </div>
          <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary mt-0.5" />
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
          <span className="truncate max-w-[210px] text-muted-foreground/80">
            {authorLabel}
          </span>
          {yearLabel && (
            <span className="shrink-0 font-mono tabular-nums text-muted-foreground/80">
              {yearLabel}
            </span>
          )}
        </div>
      </div>
    </a>
  );
});

/* -------------------------------------------------------------------------- */
/*  Zero-Waste Report Inspector (Only Verified Evidence)                      */
/* -------------------------------------------------------------------------- */

export default function ReportInspector({
  topic,
  sources,
  isRunning = false,
  pdfFilename,
  onDownloadPdf,
  onToggleCollapse,
}: ReportInspectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [pdfPending, setPdfPending] = useState(false);

  const filteredSources = useMemo(() => {
    if (!searchQuery.trim()) return sources;
    const q = searchQuery.toLowerCase().trim();
    return sources.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.venue && s.venue.toLowerCase().includes(q)) ||
        (s.authors && s.authors.toLowerCase().includes(q))
    );
  }, [sources, searchQuery]);

  const handlePdfDownload = async () => {
    if (!pdfFilename || !onDownloadPdf || pdfPending) return;
    setPdfPending(true);
    try {
      await onDownloadPdf(pdfFilename);
    } finally {
      setPdfPending(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xs">
      {/* Top Header — Clean Minimalist */}
      <div className="border-b border-border/80 bg-sunk/40 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sources ({sources.length})
            </h3>
            {topic && (
              <p className="mt-1 truncate text-xs font-medium text-foreground/80">
                {topic}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pdfFilename && onDownloadPdf && (
              <button
                type="button"
                onClick={handlePdfDownload}
                disabled={pdfPending}
                className="uv-btn-galaxy"
                title="Download PDF Dossier"
              >
                <span className="uv-btn-galaxy-inner">
                  {pdfPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <FileDown className="size-3" />
                  )}
                  <span>PDF</span>
                </span>
              </button>
            )}

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="uv-galaxy-icon-btn"
                title="Close Sources"
                aria-label="Close sources panel"
              >
                <PanelRightClose className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Uiverse Satyam Animated Pill Search */}
        {sources.length > 3 && (
          <form
            className="uv-satyam-search mt-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <button type="button" className="uv-search-icon-btn" aria-label="Search">
              <Search className="size-3.5" />
            </button>
            <input
              type="text"
              placeholder="Search by title, author, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="uv-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="uv-search-reset"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>
        )}
      </div>

      {/* Sources List — The ONLY Content That Matters */}
      <div className="flex-1 overflow-y-auto p-3.5">
        {filteredSources.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            {isRunning
              ? "Retrieving and verifying peer-reviewed academic sources..."
              : searchQuery
              ? "No sources matching your search."
              : "No external references attached to this investigation."}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredSources.map((source, idx) => (
              <InspectorSourceCard
                key={`${source.url}-${idx}`}
                index={idx + 1}
                source={source}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useCallback, useState } from "react";
import { ArrowUpRight, BookOpen, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * VerifiedSourceCard — Adapted from D:\LetsCode\UI_COMPONENTS
 * Merges Spotlight Border (motion-primitives) + Bento Card Structure (kokonutui/originui).
 * Features mouse-following radial spotlight on border, high-contrast academic typography,
 * and direct citation jump highlighting.
 */

export interface SourceCardData {
  title: string;
  url: string;
  authors?: string;
  year?: string | number;
  venue?: string;
}

interface VerifiedSourceCardProps {
  index: number;
  source: SourceCardData;
  className?: string;
}

function resolveHostname(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

export default function VerifiedSourceCard({
  index,
  source,
  className,
}: VerifiedSourceCardProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const domain = resolveHostname(source.url);
  const cleanTitle = source.title ? source.title.replace(/^\[.*?\]\s*/, "") : "Untitled Evidence Reference";
  const venueLabel = source.venue || domain;
  const authorLabel = source.authors || "Primary Investigators";
  const yearLabel = source.year ? String(source.year) : "n.d.";

  return (
    <a
      id={`ref-${index}`}
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("uv-galaxy-card group", className)}
    >
      <div className="uv-galaxy-card-inner p-3">
        <div className="flex items-start justify-between gap-2.5">
          <p className="line-clamp-2 text-xs font-medium tracking-tight text-foreground leading-snug group-hover:text-primary transition-colors">
            {cleanTitle}
          </p>
          <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary mt-0.5" />
        </div>

        {/* Footer: Authors + Publication Year */}
        <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
          <span className="truncate max-w-[210px] text-muted-foreground/80">
            {authorLabel}
          </span>
          <span className="shrink-0 font-mono tabular-nums text-muted-foreground/80">
            {yearLabel}
          </span>
        </div>
      </div>
    </a>
  );
}

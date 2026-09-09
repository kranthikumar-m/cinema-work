"use client";

import { cn } from "@/lib/utils";
import { useMovieSections } from "@/components/movie/MovieSectionRail";

/**
 * Mobile/tablet section navigation for a movie page. On large screens the
 * left rail (`MovieSectionRail`) takes over, so this is hidden there.
 */
export function MovieDetailSubnav() {
  const { present, activeId, setActiveId } = useMovieSections();

  if (present.length === 0) return null;

  return (
    <div className="sticky top-[64px] z-20 border-b border-[var(--color-border)] bg-[rgba(26,30,46,0.92)] backdrop-blur-xl lg:hidden">
      <div className="app-page-shell-detail flex items-center gap-6 overflow-x-auto py-3 scrollbar-hide">
        {present.map((section) => {
          const isActive = activeId === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={() => setActiveId(section.id)}
              className={cn(
                "shrink-0 font-[family-name:var(--font-heading)] text-xs font-bold uppercase tracking-[0.14em] transition-colors",
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-muted-strong)] hover:text-[var(--color-text)]"
              )}
            >
              {section.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

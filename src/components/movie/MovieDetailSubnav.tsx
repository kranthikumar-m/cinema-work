"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const MOVIE_DETAIL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "cast-crew", label: "Cast & Crew" },
  { id: "songs", label: "Songs" },
  { id: "videos", label: "Videos" },
  { id: "gallery", label: "Gallery" },
  { id: "reviews", label: "Reviews" },
  { id: "news", label: "News" },
  { id: "similar", label: "Similar" },
] as const;

type Tab = { id: string; label: string };

export function MovieDetailSubnav() {
  // Start with the full set (SSR/first paint), then narrow to the sections that
  // actually rendered — most movie sections are conditional.
  const [tabs, setTabs] = useState<Tab[]>(
    MOVIE_DETAIL_TABS.map((tab) => ({ id: tab.id, label: tab.label }))
  );
  const [activeId, setActiveId] = useState<string>("overview");

  useEffect(() => {
    const present = MOVIE_DETAIL_TABS.filter((tab) => document.getElementById(tab.id));
    setTabs(present.map((tab) => ({ id: tab.id, label: tab.label })));
    if (present.length) setActiveId((current) =>
      present.some((tab) => tab.id === current) ? current : present[0].id
    );

    // Scroll-spy: the active tab follows whichever section sits under the sticky
    // header. We track the set of currently-visible sections and pick the first
    // one in declared (top-to-bottom) order.
    const sections = present
      .map((tab) => document.getElementById(tab.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const current = present.find((tab) => visible.has(tab.id));
        if (current) setActiveId(current.id);
      },
      { rootMargin: "-150px 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (tabs.length === 0) return null;

  return (
    <div className="sticky top-[84px] z-20 border-b border-[var(--color-border)] bg-[rgba(26,30,46,0.92)] backdrop-blur-xl">
      <div className="app-page-shell-detail flex items-center gap-8 overflow-x-auto py-4 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeId === tab.id;

          return (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              onClick={() => setActiveId(tab.id)}
              className={cn(
                "shrink-0 font-[family-name:var(--font-heading)] text-sm font-semibold uppercase tracking-[0.14em] transition-colors",
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-muted-strong)] hover:text-[var(--color-text)]"
              )}
            >
              {tab.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const MOVIE_DETAIL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "reviews", label: "Reviews" },
  { id: "box-office", label: "Box Office" },
] as const;

function readHash() {
  if (typeof window === "undefined") {
    return "overview";
  }

  return window.location.hash.replace("#", "") || "overview";
}

export function MovieDetailSubnav() {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const syncHash = () => setActiveTab(readHash());

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <div className="sticky top-[84px] z-20 border-b border-[var(--color-border)] bg-[rgba(26,30,46,0.92)] backdrop-blur-xl">
      <div className="app-page-shell-detail flex items-center gap-8 overflow-x-auto py-4 scrollbar-hide">
        {MOVIE_DETAIL_TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <a
              key={tab.id}
              href={`#${tab.id}`}
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

"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { FeedCard } from "@/components/feed/FeedCard";
import type { FeedItem, FeedKind } from "@/types/feed";

interface FeedTab {
  key: string;
  label: string;
  kinds: FeedKind[] | null;
}

// Tab order mirrors the page's reading order; kinds map several feed kinds onto
// one tab (Trailers also holds teasers, Videos holds songs and misc videos).
const TABS: FeedTab[] = [
  { key: "all", label: "All", kinds: null },
  { key: "news", label: "News", kinds: ["news"] },
  { key: "features", label: "Features", kinds: ["feature"] },
  { key: "trailers", label: "Trailers", kinds: ["trailer", "teaser"] },
  { key: "reviews", label: "Reviews", kinds: ["review"] },
  { key: "interviews", label: "Interviews", kinds: ["interview"] },
  { key: "videos", label: "Videos", kinds: ["song", "video"] },
  { key: "photos", label: "Photos", kinds: ["photo"] },
  { key: "quiz", label: "Quiz", kinds: ["quiz"] },
  { key: "polls", label: "Polls", kinds: ["poll"] },
];

const PAGE_SIZE = 18;

interface FeedStreamProps {
  items: FeedItem[];
}

/**
 * Filterable masonry of feed cards. The active tab is mirrored into `?feed=`
 * (without a navigation) so a filtered view can be shared.
 */
export function FeedStream({ items }: FeedStreamProps) {
  const searchParams = useSearchParams();
  const requested = searchParams.get("feed") ?? "all";

  const tabs = useMemo(
    () =>
      TABS.filter(
        (tab) => tab.kinds === null || items.some((item) => tab.kinds!.includes(item.kind))
      ),
    [items]
  );
  const initial = tabs.some((tab) => tab.key === requested) ? requested : "all";
  const [active, setActive] = useState(initial);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const activeTab = tabs.find((tab) => tab.key === active) ?? tabs[0];
  const filtered = useMemo(
    () =>
      activeTab?.kinds ? items.filter((item) => activeTab.kinds!.includes(item.kind)) : items,
    [activeTab, items]
  );
  const visible = filtered.slice(0, limit);

  function selectTab(key: string) {
    setActive(key);
    setLimit(PAGE_SIZE);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (key === "all") url.searchParams.delete("feed");
      else url.searchParams.set("feed", key);
      window.history.replaceState(null, "", url.toString());
    }
  }

  if (!items.length) {
    return (
      <p className="py-16 text-center text-sm text-[var(--color-muted)]">
        The feed is warming up. Check back in a moment.
      </p>
    );
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Feed filters"
        className="sticky top-0 z-20 -mx-1 mb-[2px] flex gap-1 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 px-1 py-2 backdrop-blur scrollbar-hide xl:top-0"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab?.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectTab(tab.key)}
              className={cn(
                "relative shrink-0 px-3 py-2 font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
                isActive
                  ? "text-[var(--color-text)] after:absolute after:inset-x-3 after:-bottom-2 after:h-0.5 after:bg-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="columns-1 gap-[2px] sm:columns-2 2xl:columns-3">
        {visible.map((item) => (
          <div key={item.id} className="mb-[2px] break-inside-avoid">
            <FeedCard item={item} />
          </div>
        ))}
      </div>

      {filtered.length > limit && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setLimit((value) => value + PAGE_SIZE)}
            className="rounded-full border border-[var(--color-border)] px-6 py-2.5 text-sm font-semibold text-[var(--color-text)] transition hover:border-[rgba(194,154,98,0.5)] hover:bg-[var(--color-accent-soft)]"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

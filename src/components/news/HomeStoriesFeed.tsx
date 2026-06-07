"use client";

import { useState } from "react";
import { NewsCard } from "@/components/news/NewsCard";
import type { NewsCategory, NewsItem } from "@/services/telugu-news";

const TABS: { key: "all" | NewsCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "news", label: "News" },
  { key: "review", label: "Reviews" },
  { key: "interview", label: "Interviews" },
];

export function HomeStoriesFeed({ items, limit = 6 }: { items: NewsItem[]; limit?: number }) {
  const [tab, setTab] = useState<"all" | NewsCategory>("all");
  const filtered = (tab === "all" ? items : items.filter((i) => i.category === tab)).slice(
    0,
    limit
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const isActive = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "border border-[rgba(194,154,98,0.46)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "border border-[var(--color-border)] text-[var(--color-muted-strong)] hover:border-[rgba(194,154,98,0.4)] hover:text-[var(--color-text)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">
          No stories in this category right now.
        </p>
      )}
    </div>
  );
}

import Image from "next/image";
import { Newspaper, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { NewsItem } from "@/services/telugu-news";

const CATEGORY_LABELS: Record<NewsItem["category"], string> = {
  news: "News",
  review: "Review",
  interview: "Interview",
  feature: "Feature",
};

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(39,44,64,0.92)_0%,rgba(29,34,51,0.9)_100%)] transition-all hover:border-[rgba(194,154,98,0.3)]"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[rgba(17,22,35,0.9)] to-[rgba(34,40,59,0.96)]">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Newspaper className="h-10 w-10 text-[rgba(194,154,98,0.28)]" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {CATEGORY_LABELS[item.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 line-clamp-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">
          {item.title}
        </h3>
        {item.excerpt && (
          <p className="mb-3 line-clamp-2 text-xs text-[var(--color-muted-strong)]">
            {item.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between text-xs">
          <span className="text-[var(--color-muted)]">
            {item.sourceLabel}
            {item.publishedAt ? ` · ${formatDate(item.publishedAt)}` : ""}
          </span>
          <ExternalLink className="h-4 w-4 text-[var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </a>
  );
}

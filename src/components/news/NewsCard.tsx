import Image from "next/image";
import { Newspaper } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TypeBadge } from "@/components/shared/TypeBadge";
import type { NewsItem } from "@/services/telugu-news";

/** Story tile: image, colour-coded type badge, headline, source and date. */
export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden bg-[var(--color-surface)] outline-none transition-colors hover:bg-[var(--color-surface-strong)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[var(--color-bg-elevated)]">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.04]"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Newspaper className="h-10 w-10 text-[var(--color-muted)]" strokeWidth={1.4} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        <TypeBadge kind={item.category} />
        <h3 className="mt-2 line-clamp-2 font-[family-name:var(--font-heading)] text-[15px] font-semibold leading-snug text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent-strong)]">
          {item.title}
        </h3>
        {item.excerpt && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--color-muted-strong)]">
            {item.excerpt}
          </p>
        )}
        <p className="mt-auto pt-3 text-[11px] text-[var(--color-muted)]">
          {item.sourceLabel}
          {item.publishedAt ? ` · ${formatDate(item.publishedAt)}` : ""}
        </p>
      </div>
    </a>
  );
}

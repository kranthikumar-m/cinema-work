import Image from "next/image";
import Link from "next/link";
import { BarChart3, BrainCircuit, Eye, Images, Newspaper, Play } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TypeBadge } from "@/components/shared/TypeBadge";
import type { FeedItem } from "@/types/feed";

function formatViews(value: number | null | undefined): string | null {
  if (value == null) return null;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M views`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K views`;
  return `${value} views`;
}

function aspectFor(kind: FeedItem["kind"]) {
  switch (kind) {
    case "photo":
      return "aspect-[3/4]";
    case "trailer":
    case "teaser":
    case "song":
    case "video":
      return "aspect-video";
    default:
      return "aspect-[16/10]";
  }
}

const isVideo = (kind: FeedItem["kind"]) =>
  kind === "trailer" || kind === "teaser" || kind === "song" || kind === "video";

/**
 * One feed tile: image with the type badge, title and date on a bottom
 * gradient. Video kinds get a play glyph; photo sets get a count.
 */
export function FeedCard({ item }: { item: FeedItem }) {
  const views = formatViews(item.meta?.views);

  // Interactive kinds have no image: a compact text tile that jumps to the widget.
  if (item.kind === "poll" || item.kind === "quiz") {
    const Icon = item.kind === "poll" ? BarChart3 : BrainCircuit;
    return (
      <a
        href={item.href}
        className="group relative block overflow-hidden bg-[var(--color-surface)] p-4 outline-none transition-colors hover:bg-[var(--color-surface-strong)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <TypeBadge kind={item.kind} />
            <h3 className="mt-1.5 line-clamp-3 font-[family-name:var(--font-heading)] text-[15px] font-semibold leading-snug text-[var(--color-text)]">
              {item.title}
            </h3>
            <p className="mt-1 text-[11px] text-[var(--color-muted)]">
              {item.subtitle}
              {item.date ? ` · ${formatDate(item.date)}` : ""}
            </p>
            <span className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-accent)]">
              {item.kind === "poll" ? "Vote now" : "Play now"}
            </span>
          </div>
        </div>
      </a>
    );
  }

  const body = (
    <>
      <div className={`relative w-full overflow-hidden ${aspectFor(item.kind)}`}>
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.04]"
            unoptimized={!item.image.includes("image.tmdb.org")}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[var(--color-bg-elevated)]">
            <Newspaper className="h-10 w-10 text-[var(--color-muted)]" strokeWidth={1.4} />
          </div>
        )}

        {isVideo(item.kind) && (
          <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/35 text-white backdrop-blur-sm transition group-hover:scale-105 group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-accent-contrast)]">
            <Play className="h-5 w-5 fill-current" />
          </span>
        )}
        {item.kind === "photo" && item.meta?.count ? (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
            <Images className="h-3 w-3" />
            {item.meta.count}
          </span>
        ) : null}

        <div className="tile-overlay absolute inset-x-0 bottom-0 px-3.5 pb-3 pt-14">
          <TypeBadge kind={item.kind} />
          <h3 className="mt-1.5 line-clamp-2 font-[family-name:var(--font-heading)] text-[15px] font-semibold leading-snug text-white">
            {item.title}
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-white/60">
            {item.subtitle && <span className="truncate">{item.subtitle}</span>}
            {item.date && <span>{formatDate(item.date)}</span>}
            {views && (
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {views}
              </span>
            )}
          </p>
        </div>
      </div>
    </>
  );

  const className =
    "group relative block overflow-hidden bg-[var(--color-surface)] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]";

  return item.external ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <Link href={item.href} className={className}>
      {body}
    </Link>
  );
}

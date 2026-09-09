"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, Play } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  VIDEO_CATEGORIES,
  VIDEO_CATEGORY_LABELS,
  VIDEO_CATEGORY_SINGULAR,
  type VideoCategory,
} from "@/lib/video-category";
import { TypeBadge, type ContentKind } from "@/components/shared/TypeBadge";
import { VideoPlayerModal } from "@/components/movie/VideoPlayerModal";
import type { VideoWallItem } from "@/services/videos-feed";

function badgeKind(category: VideoCategory): ContentKind {
  if (category === "trailer" || category === "teaser") return category;
  if (category === "song" || category === "lyrical") return "song";
  if (category === "interview") return "interview";
  if (category === "review") return "review";
  return "video";
}

function formatViews(value: number | null): string | null {
  if (value == null) return null;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

interface VideoWallProps {
  items: VideoWallItem[];
}

/** Category-tabbed grid of video tiles with duration, views and date. */
export function VideoWall({ items }: VideoWallProps) {
  const searchParams = useSearchParams();
  const requested = searchParams.get("category");

  const categories = useMemo(
    () => VIDEO_CATEGORIES.filter((category) => items.some((item) => item.category === category)),
    [items]
  );
  const initial =
    requested && categories.includes(requested as VideoCategory) ? (requested as VideoCategory) : "all";
  const [active, setActive] = useState<VideoCategory | "all">(initial);
  const [playing, setPlaying] = useState<VideoWallItem | null>(null);

  const visible = active === "all" ? items : items.filter((item) => item.category === active);

  function select(category: VideoCategory | "all") {
    setActive(category);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (category === "all") url.searchParams.delete("category");
      else url.searchParams.set("category", category);
      window.history.replaceState(null, "", url.toString());
    }
  }

  return (
    <>
      <div
        role="tablist"
        className="sticky top-[64px] z-20 -mx-1 mb-[2px] flex gap-1 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 px-1 py-2 backdrop-blur scrollbar-hide"
      >
        {(["all", ...categories] as (VideoCategory | "all")[]).map((category) => {
          const isActive = category === active;
          const count = category === "all" ? items.length : items.filter((i) => i.category === category).length;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => select(category)}
              className={cn(
                "relative shrink-0 px-3 py-2 font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
                isActive
                  ? "text-[var(--color-text)] after:absolute after:inset-x-3 after:-bottom-2 after:h-0.5 after:bg-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              )}
            >
              {category === "all" ? "All" : VIDEO_CATEGORY_LABELS[category]}
              <span className="ml-1.5 text-[var(--color-muted)]">{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length ? (
        <div className="tile-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((item) => (
            <div key={item.key} className="group relative bg-[var(--color-surface)]">
              <button
                type="button"
                onClick={() => setPlaying(item)}
                className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
                aria-label={`Play ${item.title}`}
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={`https://img.youtube.com/vi/${item.key}/hqdefault.jpg`}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.04]"
                    unoptimized
                  />
                  <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/35 text-white backdrop-blur-sm transition group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-accent-contrast)]">
                    <Play className="h-5 w-5 fill-current" />
                  </span>
                  {item.durationLabel && (
                    <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                      {item.durationLabel}
                    </span>
                  )}
                </div>
                <div className="px-3 pb-3 pt-2.5">
                  <TypeBadge kind={badgeKind(item.category)} label={VIDEO_CATEGORY_SINGULAR[item.category]} />
                  <p className="mt-1.5 line-clamp-2 font-[family-name:var(--font-heading)] text-[14px] font-semibold leading-snug text-[var(--color-text)]">
                    {item.title}
                  </p>
                </div>
              </button>
              <p className="flex flex-wrap items-center gap-x-2 px-3 pb-3 text-[11px] text-[var(--color-muted)]">
                <Link
                  href={`/movie/${item.movieId}`}
                  className="truncate font-semibold text-[var(--color-muted-strong)] transition hover:text-[var(--color-accent)]"
                >
                  {item.movieTitle}
                </Link>
                {item.publishedAt && <span>{formatDate(item.publishedAt)}</span>}
                {formatViews(item.views) && (
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatViews(item.views)}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-[var(--color-muted)]">No videos in this category yet.</p>
      )}

      <VideoPlayerModal
        videoKey={playing?.key ?? null}
        title={playing?.title ?? ""}
        videos={visible.map((item) => ({ key: item.key, title: item.title, category: item.category }))}
        onClose={() => setPlaying(null)}
      />
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
import { TypeBadge } from "@/components/shared/TypeBadge";
import type { GalleryKind, GalleryWallItem } from "@/services/gallery";

type Tab = "all" | GalleryKind;

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "Latest" },
  { key: "still", label: "Stills" },
  { key: "poster", label: "Posters" },
];

interface GalleryMasonryProps {
  items: GalleryWallItem[];
}

/** Masonry of stills and posters with a lightbox; tabs mirror into `?tab=`. */
export function GalleryMasonry({ items }: GalleryMasonryProps) {
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(requested && TABS.some((t) => t.key === requested) ? requested : "all");
  const [selected, setSelected] = useState<number | null>(null);

  const visible = useMemo(
    () => (tab === "all" ? items : items.filter((item) => item.kind === tab)),
    [items, tab]
  );

  useEffect(() => {
    if (selected === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
      else if (event.key === "ArrowLeft") setSelected((s) => (s !== null && s > 0 ? s - 1 : s));
      else if (event.key === "ArrowRight")
        setSelected((s) => (s !== null && s < visible.length - 1 ? s + 1 : s));
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected, visible.length]);

  function select(next: Tab) {
    setTab(next);
    setSelected(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (next === "all") url.searchParams.delete("tab");
      else url.searchParams.set("tab", next);
      window.history.replaceState(null, "", url.toString());
    }
  }

  const current = selected !== null ? visible[selected] : null;

  return (
    <>
      <div
        role="tablist"
        className="sticky top-[64px] z-20 -mx-1 mb-[2px] flex gap-1 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 px-1 py-2 backdrop-blur"
      >
        {TABS.map((entry) => {
          const isActive = entry.key === tab;
          const count = entry.key === "all" ? items.length : items.filter((i) => i.kind === entry.key).length;
          return (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => select(entry.key)}
              className={cn(
                "relative px-3 py-2 font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
                isActive
                  ? "text-[var(--color-text)] after:absolute after:inset-x-3 after:-bottom-2 after:h-0.5 after:bg-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              )}
            >
              {entry.label}
              <span className="ml-1.5 text-[var(--color-muted)]">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="columns-2 gap-[2px] md:columns-3 xl:columns-4">
        {visible.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(index)}
            className="group relative mb-[2px] block w-full break-inside-avoid overflow-hidden bg-[var(--color-surface)] text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
            style={{ aspectRatio: String(item.aspectRatio) }}
          >
            <Image
              src={getImageUrl(item.filePath, item.kind === "still" ? "w780" : "w500")}
              alt={`${item.movieTitle} ${item.kind}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.04]"
            />
            <div className="tile-overlay absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-10 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <TypeBadge kind="photo" label={item.kind === "still" ? "Still" : "Poster"} />
              <p className="mt-1 truncate text-[13px] font-semibold text-white">{item.movieTitle}</p>
            </div>
          </button>
        ))}
      </div>

      {current && selected !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-10"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${current.movieTitle} ${current.kind}`}
        >
          <span className="absolute left-5 top-5 text-sm text-white/70">
            {selected + 1} / {visible.length}
          </span>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white/90 transition hover:bg-black/80"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="relative h-[82vh] w-full max-w-[1400px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="relative mx-auto h-full max-w-full"
              style={{ aspectRatio: String(current.aspectRatio) }}
            >
              <Image
                key={current.id}
                src={getImageUrl(current.filePath, "original")}
                alt={`${current.movieTitle} ${current.kind}`}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            {selected > 0 && (
              <button
                type="button"
                onClick={() => setSelected(selected - 1)}
                className="absolute left-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/80"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            {selected < visible.length - 1 && (
              <button
                type="button"
                onClick={() => setSelected(selected + 1)}
                className="absolute right-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/80"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center text-sm text-white/85">
            <Link
              href={`/movie/${current.movieId}#gallery`}
              className="font-semibold transition hover:text-[var(--color-accent-strong)]"
              onClick={(event) => event.stopPropagation()}
            >
              {current.movieTitle}
            </Link>
            <span className="text-white/50"> · {current.kind === "still" ? "Still" : "Poster"} · TMDB</span>
          </div>
        </div>
      )}
    </>
  );
}

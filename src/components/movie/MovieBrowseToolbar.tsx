"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SlidersHorizontal, Search, X, RotateCcw } from "lucide-react";
import { DualRangeSlider } from "./DualRangeSlider";
import type { Genre } from "@/types/tmdb";
import type { TeluguBrowseView } from "@/services/telugu-movies";

export interface BrowseTab {
  value: TeluguBrowseView;
  label: string;
}

const DEFAULT_TABS: BrowseTab[] = [
  { value: "popular", label: "POPULAR" },
  { value: "latest", label: "LATEST" },
  { value: "upcoming", label: "UPCOMING RELEASES" },
  { value: "online", label: "MOVIES ONLINE" },
  { value: "az", label: "A-Z" },
];

interface MovieBrowseToolbarProps {
  view: TeluguBrowseView;
  genres: Genre[];
  genreId: string;
  minRating: number;
  maxRating: number;
  minYear: number;
  maxYear: number;
  yearBounds: { min: number; max: number };
  /** Custom tab set + the tab whose URL omits the `view` param. */
  tabs?: BrowseTab[];
  defaultView?: TeluguBrowseView;
}

export function MovieBrowseToolbar({
  view,
  genres,
  genreId,
  minRating,
  maxRating,
  minYear,
  maxYear,
  yearBounds,
  tabs = DEFAULT_TABS,
  defaultView = "latest",
}: MovieBrowseToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panelRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState(genreId);
  const [rating, setRating] = useState<[number, number]>([minRating, maxRating]);
  const [years, setYears] = useState<[number, number]>([minYear, maxYear]);

  // Re-sync local controls whenever the applied (URL) values change.
  useEffect(() => setGenre(genreId), [genreId]);
  useEffect(() => setRating([minRating, maxRating]), [minRating, maxRating]);
  useEffect(() => setYears([minYear, maxYear]), [minYear, maxYear]);

  // Close the panel on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const tabHref = useCallback(
    (value: TeluguBrowseView) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === defaultView) params.delete("view");
      else params.set("view", value);
      params.delete("page");
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams, defaultView]
  );

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());

    if (genre) params.set("genre", genre);
    else params.delete("genre");

    if (rating[0] > 0) params.set("minRating", String(rating[0]));
    else params.delete("minRating");
    if (rating[1] < 10) params.set("maxRating", String(rating[1]));
    else params.delete("maxRating");

    if (years[0] > yearBounds.min) params.set("minYear", String(years[0]));
    else params.delete("minYear");
    if (years[1] < yearBounds.max) params.set("maxYear", String(years[1]));
    else params.delete("maxYear");

    params.delete("page");
    setOpen(false);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  function resetFilters() {
    setGenre("");
    setRating([0, 10]);
    setYears([yearBounds.min, yearBounds.max]);
    const params = new URLSearchParams();
    if (view !== defaultView) params.set("view", view);
    setOpen(false);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = search.trim();
    if (q.length >= 2) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const activeFilterCount =
    (genreId ? 1 : 0) +
    (minRating > 0 || maxRating < 10 ? 1 : 0) +
    (minYear > yearBounds.min || maxYear < yearBounds.max ? 1 : 0);

  const selectClass =
    "h-11 w-full rounded-lg border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] px-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]";

  return (
    <div className="sticky top-[84px] z-20 -mx-[var(--app-page-gutter)] mb-6 border-b border-[var(--color-border)] bg-[rgba(26,30,46,0.92)] px-[var(--app-page-gutter)] py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <nav className="scrollbar-hide flex items-center gap-5 overflow-x-auto sm:gap-7">
          {tabs.map((tab) => {
            const active = view === tab.value;
            return (
              <Link
                key={tab.value}
                href={tabHref(tab.value)}
                className={`relative whitespace-nowrap py-1 text-xs font-semibold uppercase tracking-[0.12em] transition sm:text-sm ${
                  active
                    ? "text-[var(--color-text)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute -bottom-[13px] left-0 h-[2px] w-full rounded-full bg-[var(--color-accent)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Filters"
            aria-expanded={open}
            className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg border transition ${
              open || activeFilterCount > 0
                ? "border-[rgba(194,154,98,0.5)] text-[var(--color-accent-strong)]"
                : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-[var(--color-accent-contrast)]">
                {activeFilterCount}
              </span>
            )}
          </button>

          {open && (
            <div
              ref={panelRef}
              className="absolute right-0 top-12 z-30 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5 shadow-[0_24px_70px_rgba(7,10,18,0.5)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]">
                  Filters
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close filters"
                  className="text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Search movies / cast & crew */}
              <form onSubmit={submitSearch} className="mb-4">
                <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Movies or cast &amp; crew…"
                    className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] pl-3 pr-10 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]"
                  />
                  <button
                    type="submit"
                    aria-label="Search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>

              {/* Genre */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Genre
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className={selectClass}
                >
                  <option value="">All Genres</option>
                  {genres.map((g) => (
                    <option key={g.id} value={String(g.id)}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Rating
                </label>
                <DualRangeSlider
                  min={0}
                  max={10}
                  step={0.5}
                  low={rating[0]}
                  high={rating[1]}
                  onChange={(lo, hi) => setRating([lo, hi])}
                  formatValue={(v) => v.toFixed(1)}
                />
              </div>

              {/* Year */}
              <div className="mb-5">
                <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Year
                </label>
                <DualRangeSlider
                  min={yearBounds.min}
                  max={yearBounds.max}
                  step={1}
                  low={years[0]}
                  high={years[1]}
                  onChange={(lo, hi) => setYears([lo, hi])}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-muted-strong)] transition hover:text-[var(--color-text)]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-accent-contrast)] transition hover:bg-[var(--color-accent-strong)]"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

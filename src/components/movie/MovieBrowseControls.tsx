"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { Genre } from "@/types/tmdb";

interface MovieBrowseControlsProps {
  genres: Genre[];
  sort: string;
  status: string;
  genreId: string;
}

const SORT_OPTIONS = [
  { value: "popularity", label: "Most Popular" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "rating", label: "Highest Rated" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Movies" },
  { value: "released", label: "Released" },
  { value: "upcoming", label: "Upcoming" },
];

const selectClass =
  "h-11 rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] px-3 pr-8 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]";

export function MovieBrowseControls({ genres, sort, status, genreId }: MovieBrowseControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Any filter/sort change resets to the first page.
      params.delete("page");
      router.push(`/movies?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
        Sort
        <select
          className={selectClass}
          value={sort}
          onChange={(e) => update("sort", e.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
        Status
        <select
          className={selectClass}
          value={status}
          onChange={(e) => update("status", e.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
        Genre
        <select
          className={selectClass}
          value={genreId}
          onChange={(e) => update("genre", e.target.value)}
        >
          <option value="">All Genres</option>
          {genres.map((genre) => (
            <option key={genre.id} value={String(genre.id)}>
              {genre.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

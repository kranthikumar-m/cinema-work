"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Plus,
  CalendarClock,
  Search,
  X,
  Check,
  Film,
  Loader2,
} from "lucide-react";
import { useOptionalAuthUser } from "@/components/auth/AuthUserProvider";
import { useOptionalAboCalibration } from "@/components/movie/AboCalibration";
import type { AdminMovieSearchResult } from "@/types/admin";

/**
 * Single consolidated admin menu for the movies page. Keeps the page clean by
 * gathering all admin actions under one button: "Add movie" (manually add a
 * TMDB film, which surfaces in Upcoming/Latest by its date) and "Calibrate
 * dates (ABO)" (toggles the drag-and-drop date calibration). Future admin tools
 * slot in here too. Renders nothing for non-admins.
 */
export function MoviesAdminMenu() {
  const auth = useOptionalAuthUser();
  const calibration = useOptionalAboCalibration();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  if (auth?.user?.role !== "admin") return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
          open || calibration?.active
            ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
            : "border-[rgba(26,167,230,0.32)] text-[var(--color-accent)] hover:border-[rgba(26,167,230,0.6)] hover:bg-[var(--color-accent-soft)]"
        }`}
      >
        <Wrench className="h-4 w-4" />
        Admin tools
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-1.5 shadow-[0_24px_70px_rgba(7,10,18,0.55)]">
            <button
              type="button"
              onClick={() => {
                setShowAdd(true);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--color-text)] transition hover:bg-[var(--color-accent-soft)]"
            >
              <Plus className="h-4 w-4 text-[var(--color-accent)]" />
              Add movie
            </button>

            {calibration && (
              <button
                type="button"
                onClick={() => {
                  calibration.toggle();
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--color-text)] transition hover:bg-[var(--color-accent-soft)]"
              >
                <span className="flex items-center gap-3">
                  <CalendarClock className="h-4 w-4 text-[var(--color-accent)]" />
                  Calibrate dates (ABO)
                </span>
                {calibration.active && (
                  <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                )}
              </button>
            )}
          </div>
        </>
      )}

      {showAdd && (
        <AddMovieModal
          onClose={() => {
            setShowAdd(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function formatYear(date: string): string {
  return /^\d{4}/.test(date) ? date.slice(0, 4) : "TBA";
}

function AddMovieModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminMovieSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/movies/search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { error?: string; results?: AdminMovieSearchResult[] };
      if (!res.ok || !data.results) throw new Error(data.error || "Search failed.");
      setResults(data.results);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }, [query]);

  async function addMovie(movie: AdminMovieSearchResult) {
    setSavingId(movie.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/movies/${movie.id}/add`, { method: "POST" });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      // 409 = already added — treat as success for the UI.
      if (!res.ok && res.status !== 409) throw new Error(data.error || "Failed to add.");
      setAddedIds((prev) => new Set(prev).add(movie.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add movie.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] shadow-[0_30px_90px_rgba(7,10,18,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Add movie
            </h3>
            <p className="mt-1 text-sm text-[var(--color-muted-strong)]">
              Search TMDB and add a film — it appears in Upcoming or Latest by its
              release date.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch();
          }}
          className="flex gap-2 px-5 py-4"
        >
          <div className="relative flex-1">
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a movie to add…"
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] pl-10 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(26,167,230,0.46)]"
            />
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-accent)]" />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)] transition hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </button>
        </form>

        {error && (
          <p className="mx-5 mb-3 rounded-lg border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-3 py-2 text-xs text-[#ffcfcc]">
            {error}
          </p>
        )}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 pb-5">
          {results.map((movie) => {
            const added = addedIds.has(movie.id);
            return (
              <div
                key={movie.id}
                className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-[var(--color-border)] hover:bg-white/[0.03]"
              >
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-deep)]">
                  {movie.posterUrl ? (
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Film className="h-4 w-4 text-[var(--color-muted)]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text)]">
                    {movie.title}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted-strong)]">
                    {formatYear(movie.releaseDate)} · {movie.originalLanguage.toUpperCase()}
                  </p>
                </div>
                {added ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[rgba(60,180,100,0.15)] px-3 py-1.5 text-xs font-medium text-[#60c880]">
                    <Check className="h-3.5 w-3.5" />
                    Added
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={savingId === movie.id}
                    onClick={() => addMovie(movie)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-contrast)] transition hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
                  >
                    {savingId === movie.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Add
                  </button>
                )}
              </div>
            );
          })}

          {!results.length && (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-muted-strong)]">
              {searched ? "No movies found." : "Search TMDB to add a movie."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

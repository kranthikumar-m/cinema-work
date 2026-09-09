"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Trash2, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminMovieSearchResult, ManualMovieRecord } from "@/types/admin";

export function AdminMovieAdder() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminMovieSearchResult[]>([]);
  const [addedMovies, setAddedMovies] = useState<ManualMovieRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addedIds = new Set(addedMovies.map((m) => m.movieId));

  const loadAdded = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/movies/added");
      const data = (await res.json()) as { results?: ManualMovieRecord[] };
      if (data.results) setAddedMovies(data.results);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    loadAdded();
  }, [loadAdded]);

  async function runSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(
        `/api/admin/movies/search?q=${encodeURIComponent(query)}`
      );
      const data = (await res.json()) as {
        error?: string;
        results?: AdminMovieSearchResult[];
      };
      if (!res.ok || !data.results) throw new Error(data.error || "Search failed.");
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function addMovie(movie: AdminMovieSearchResult) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/movies/${movie.id}/add`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to add movie.");

      setSuccess(`"${movie.title}" added successfully.`);
      await loadAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add movie.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMovie(movieId: number, title: string) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/movies/${movieId}/add`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to remove movie.");

      setSuccess(`"${title}" removed.`);
      await loadAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove movie.");
    } finally {
      setSaving(false);
    }
  }

  function categorize(releaseDate: string | null) {
    if (!releaseDate) return "Upcoming";
    const today = new Date().toISOString().slice(0, 10);
    return releaseDate > today ? "Upcoming" : "Recent";
  }

  return (
    <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-6 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
      <div className="mb-6">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
          Add Missing Movies
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted-strong)]">
          Search TMDB for a movie missing from the site, then add it. Movies are automatically
          placed into Recent Releases, Upcoming Releases, or Top Rated based on their release
          date and rating.
        </p>
      </div>

      <form onSubmit={runSearch} className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search TMDB for a missing movie..."
            className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] pl-12 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]"
          />
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-accent)]" />
        </div>
        <Button type="submit" size="lg" disabled={searching}>
          {searching ? "Searching..." : "Search"}
        </Button>
      </form>

      {error && (
        <div className="mt-4 rounded-xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-3 text-sm text-[#ffcfcc]">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-xl border border-[rgba(60,180,100,0.28)] bg-[rgba(28,80,48,0.28)] px-4 py-3 text-sm text-[#c0f0d0]">
          {success}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        {/* Search Results */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.44)] p-3">
          <div className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Search Results
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {results.length ? (
              results.map((movie) => {
                const alreadyAdded = addedIds.has(movie.id);
                return (
                  <div
                    key={movie.id}
                    className="flex items-center gap-3 rounded-xl border border-transparent bg-transparent px-3 py-3 hover:border-[var(--color-border)] hover:bg-white/2"
                  >
                    <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-[var(--color-bg-deep)]">
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
                        {movie.releaseDate || "Release TBA"} |{" "}
                        {movie.originalLanguage.toUpperCase()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={saving || alreadyAdded}
                      onClick={() => addMovie(movie)}
                      className="gap-1 shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {alreadyAdded ? "Added" : "Add"}
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted-strong)]">
                Search TMDB to find missing movies.
              </div>
            )}
          </div>
        </div>

        {/* Added Movies */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.44)] p-3">
          <div className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Manually Added Movies ({addedMovies.length})
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {addedMovies.length ? (
              addedMovies.map((movie) => (
                <div
                  key={movie.movieId}
                  className="flex items-center gap-3 rounded-xl border border-transparent bg-transparent px-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">
                      {movie.tmdbTitle}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-[var(--color-muted-strong)]">
                        {movie.releaseDate || "No date"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          categorize(movie.releaseDate) === "Upcoming"
                            ? "bg-[rgba(100,160,255,0.12)] text-[#80b0ff]"
                            : "bg-[rgba(60,180,100,0.12)] text-[#60c880]"
                        }`}
                      >
                        {categorize(movie.releaseDate)}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => removeMovie(movie.movieId, movie.tmdbTitle)}
                    className="gap-1 shrink-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted-strong)]">
                No movies manually added yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

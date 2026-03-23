"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  AdminMovieSearchResult,
  MovieBackdropChoicesPayload,
} from "@/types/admin";

export function AdminBackdropManager() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminMovieSearchResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<AdminMovieSearchResult | null>(null);
  const [choices, setChoices] = useState<MovieBackdropChoicesPayload | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingChoices, setLoadingChoices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedImage = useMemo(
    () => choices?.images.find((image) => image.isSelected) ?? null,
    [choices]
  );
  const lockedBackdropPath =
    choices?.override && choices.overrideIsValid
      ? choices.override.selectedBackdropPath
      : null;

  async function runSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/movies/search?q=${encodeURIComponent(query)}`
      );
      const payload = (await response.json()) as {
        error?: string;
        results?: AdminMovieSearchResult[];
      };

      if (!response.ok || !payload.results) {
        throw new Error(payload.error || "Unable to search movies.");
      }

      setResults(payload.results);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to search movies."
      );
    } finally {
      setSearching(false);
    }
  }

  async function loadChoices(movie: AdminMovieSearchResult) {
    setSelectedMovie(movie);
    setLoadingChoices(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/movies/${movie.id}/backdrops`);
      const payload = (await response.json()) as
        | (MovieBackdropChoicesPayload & { error?: string })
        | { error?: string };

      if (!response.ok || !("movieId" in payload)) {
        throw new Error(payload.error || "Unable to load backdrop choices.");
      }

      setChoices(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load backdrop choices."
      );
      setChoices(null);
    } finally {
      setLoadingChoices(false);
    }
  }

  async function saveOverride(selectedBackdropPath: string) {
    if (!selectedMovie) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/movies/${selectedMovie.id}/backdrop-override`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedBackdropPath }),
        }
      );
      const payload = (await response.json()) as {
        error?: string;
        payload?: MovieBackdropChoicesPayload;
      };

      if (!response.ok || !payload.payload) {
        throw new Error(payload.error || "Unable to save override.");
      }

      setChoices(payload.payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save override."
      );
    } finally {
      setSaving(false);
    }
  }

  async function clearOverride() {
    if (!selectedMovie) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/movies/${selectedMovie.id}/backdrop-override`,
        {
          method: "DELETE",
        }
      );
      const payload = (await response.json()) as {
        error?: string;
        payload?: MovieBackdropChoicesPayload;
      };

      if (!response.ok || !payload.payload) {
        throw new Error(payload.error || "Unable to clear override.");
      }

      setChoices(payload.payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to clear override."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-6 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
      <div className="mb-6">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
          Movie Backdrop Overrides
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted-strong)]">
          Search a movie, inspect every TMDB backdrop, and lock one image as the primary hero artwork.
          When no override is saved, the site still falls back to the automatic best-image resolver.
        </p>
      </div>

      <form onSubmit={runSearch} className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Telugu movies or TMDB id"
            className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] pl-12 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]"
          />
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-accent)]" />
        </div>
        <Button type="submit" size="lg" disabled={searching}>
          {searching ? "Searching..." : "Search"}
        </Button>
      </form>

      {error ? (
        <div className="mt-4 rounded-xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-3 text-sm text-[#ffcfcc]">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.44)] p-3">
          <div className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Search Results
          </div>
          <div className="space-y-2">
            {results.length ? (
              results.map((movie) => (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => loadChoices(movie)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                    selectedMovie?.id === movie.id
                      ? "border-[rgba(194,154,98,0.42)] bg-[rgba(194,154,98,0.08)]"
                      : "border-transparent bg-transparent hover:border-[var(--color-border)] hover:bg-white/2"
                  }`}
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
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">
                      {movie.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted-strong)]">
                      {movie.releaseDate || "Release TBA"} | {movie.originalLanguage.toUpperCase()}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--color-accent)]">
                      {movie.validationStatus.replace("_", " ")}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted-strong)]">
                Search for a movie to load its available backdrops.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.44)] p-4">
          {loadingChoices ? (
            <div className="flex min-h-[320px] items-center justify-center text-sm text-[var(--color-muted-strong)]">
              Loading backdrop choices...
            </div>
          ) : choices ? (
            <div>
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-text)]">
                    {choices.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-muted-strong)]">
                    Current source:{" "}
                    <span className="text-[var(--color-accent)]">
                      {choices.currentSource.replace("_", " ")}
                    </span>
                    {choices.override && !choices.overrideIsValid
                      ? " | saved override no longer exists in TMDB images"
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearOverride}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Use Automatic Selection"}
                  </Button>
                </div>
              </div>

              {selectedImage ? (
                <div className="mb-5 overflow-hidden rounded-2xl border border-[var(--color-border)]">
                  <div className="relative aspect-[16/9] bg-[var(--color-bg-deep)]">
                    <Image
                      src={selectedImage.previewUrl}
                      alt={`${choices.title} selected backdrop`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {choices.images.map((image) => {
                  const isLockedSelection = image.filePath === lockedBackdropPath;

                  return (
                    <article
                      key={image.filePath}
                      className={`overflow-hidden rounded-2xl border ${
                        image.isSelected
                          ? "border-[rgba(194,154,98,0.42)] bg-[rgba(194,154,98,0.06)]"
                          : "border-[var(--color-border)] bg-[rgba(15,19,34,0.48)]"
                      }`}
                    >
                      <div className="relative aspect-[16/9] bg-[var(--color-bg-deep)]">
                        <Image
                          src={image.previewUrl}
                          alt={image.filePath}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--color-text)]">
                              {image.filePath}
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-muted-strong)]">
                              {image.width}x{image.height} | rating {image.voteAverage.toFixed(1)} | votes {image.voteCount}
                            </p>
                          </div>
                          {image.isSelected ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-accent)]" />
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          onClick={() => saveOverride(image.filePath)}
                          disabled={saving || isLockedSelection}
                          className="w-full"
                        >
                          {isLockedSelection ? "Override Saved" : "Use This Backdrop"}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] text-sm text-[var(--color-muted-strong)]">
              Select a movie on the left to review its backdrop options.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

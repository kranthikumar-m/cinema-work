"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { formatDate, getMoviePosterUrl } from "@/lib/utils";
import { RatingRing } from "@/components/shared/RatingRing";
import type { Movie } from "@/types/tmdb";

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results?.slice(0, 12) || []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, []);

  // Seed the search from a ?q= deep link (e.g. the Movies filter panel).
  useEffect(() => {
    const initial = searchParams.get("q")?.trim() ?? "";
    if (initial.length >= 2) {
      setQuery(initial);
      doSearch(initial);
    }
    // Run once on mount with whatever query the URL carries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 350);
  };

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        router.back();
      }
    },
    [router]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-[rgba(10,13,24,0.95)] backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <motion.div
        ref={containerRef}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mx-auto mt-20 max-w-2xl px-4 lg:mt-24"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-accent)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Search Telugu movies..."
            className="h-14 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-12 pr-12 text-lg text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[rgba(26,167,230,0.48)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setHasSearched(false);
                inputRef.current?.focus();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
          </div>
        )}

        {!loading && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 max-h-[60vh] overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[rgba(26,167,230,0.08)]"
          >
            {results.map((movie) => (
              <Link
                key={movie.id}
                href={`/movie/${movie.id}`}
                className="flex w-full items-center gap-4 p-3 text-left transition-colors hover:bg-[rgba(255,255,255,0.03)]"
              >
                <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-deep)]">
                  <Image
                    src={getMoviePosterUrl(movie, "w200")}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    unoptimized={!movie.poster_path && !movie.poster_url}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-text)]">
                    {movie.title}
                  </p>
                  <p className="text-xs text-[var(--color-muted-strong)]">
                    {formatDate(movie.release_date)}
                  </p>
                </div>
                <RatingRing rating={movie.imdb_rating ?? null} size={36} />
              </Link>
            ))}
          </motion.div>
        )}

        {!loading && hasSearched && query.length >= 2 && results.length === 0 && (
          <div className="mt-8 text-center text-[var(--color-muted)]">
            <p>No Telugu movie matches found for &quot;{query}&quot;</p>
          </div>
        )}

        {!query && (
          <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
            Start typing to search Telugu movies. Click anywhere outside to go back.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

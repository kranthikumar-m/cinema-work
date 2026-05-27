"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, getMoviePosterUrl } from "@/lib/utils";
import { RatingRing } from "@/components/shared/RatingRing";
import type { Movie } from "@/types/tmdb";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      setQuery("");
      setResults([]);
      document.body.style.overflow = "";
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results?.slice(0, 8) || []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 350);
  };

  const handleSelect = (id: number) => {
    onClose();
    router.push(`/movie/${id}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[rgba(10,13,24,0.92)] backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="mx-auto mt-20 max-w-2xl px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-accent)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleInput(e.target.value)}
                placeholder="Search Telugu movies..."
                className="h-14 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-12 pr-12 text-lg text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[rgba(194,154,98,0.48)] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </form>

            {loading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[rgba(194,154,98,0.08)]">
                {results.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => handleSelect(movie.id)}
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
                    <RatingRing rating={movie.vote_average} size={36} />
                  </button>
                ))}
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="mt-8 text-center text-[var(--color-muted)]">
                <p>No Telugu movie matches found for &quot;{query}&quot;</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

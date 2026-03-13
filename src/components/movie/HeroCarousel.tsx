"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingRing } from "@/components/shared/RatingRing";
import { getBackdropUrl, formatDate, truncate } from "@/lib/utils";
import type { Movie, Genre } from "@/types/tmdb";

interface HeroCarouselProps {
  movies: Movie[];
  genres: Genre[];
}

export function HeroCarousel({ movies, genres }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const items = movies.slice(0, 6);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next]);

  if (!items.length) return null;

  const movie = items[current];
  const movieGenres = movie.genre_ids
    .map((id) => genres.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <Image
            src={getBackdropUrl(movie.backdrop_path, "original")}
            alt={movie.title}
            fill
            className="object-cover"
            priority
            unoptimized={!movie.backdrop_path}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full flex items-end pb-16 px-8 md:px-16">
        <motion.div
          key={movie.id + "-content"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <RatingRing rating={movie.vote_average} size={52} />
            <div className="flex flex-wrap gap-2">
              {movieGenres.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/10"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
            {movie.title}
          </h1>
          <p className="text-gray-300 text-sm mb-2">
            {formatDate(movie.release_date)}
          </p>
          <p className="text-gray-400 text-base mb-6 line-clamp-3 max-w-xl">
            {truncate(movie.overview, 200)}
          </p>
          <div className="flex gap-3">
            <Button asChild size="lg">
              <Link href={`/movie/${movie.id}`}>
                <Play className="w-4 h-4 mr-2 fill-current" />
                Watch Trailer
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={`/movie/${movie.id}`}>
                <Info className="w-4 h-4 mr-2" />
                View Details
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-sm"
        aria-label="Previous"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-sm"
        aria-label="Next"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === current
                ? "bg-cyan-400 w-6"
                : "bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

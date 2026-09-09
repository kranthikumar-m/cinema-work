import { MovieCard } from "./MovieCard";
import type { Movie } from "@/types/tmdb";

interface MovieGridProps {
  movies: Movie[];
  columns?: string;
  linkBase?: string;
}

/** Edge-to-edge poster tiles separated by 2px gutters. */
export function MovieGrid({
  movies,
  columns = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  linkBase,
}: MovieGridProps) {
  if (!movies.length) {
    return (
      <div className="py-16 text-center text-[var(--color-muted)]">
        <p>No Telugu movies found.</p>
      </div>
    );
  }

  return (
    <div className={`tile-grid ${columns}`}>
      {movies.map((movie, i) => (
        <MovieCard key={movie.id} movie={movie} priority={i < 6} linkBase={linkBase} />
      ))}
    </div>
  );
}

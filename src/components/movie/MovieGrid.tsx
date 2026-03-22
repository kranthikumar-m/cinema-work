import { MovieCard } from "./MovieCard";
import type { Movie } from "@/types/tmdb";

interface MovieGridProps {
  movies: Movie[];
  columns?: string;
}

export function MovieGrid({
  movies,
  columns = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
}: MovieGridProps) {
  if (!movies.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>No Telugu movies found.</p>
      </div>
    );
  }

  return (
    <div className={`grid ${columns} gap-4`}>
      {movies.map((movie, i) => (
        <MovieCard key={movie.id} movie={movie} priority={i < 6} />
      ))}
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { formatDate, getMoviePosterUrl } from "@/lib/utils";
import { RatingRing } from "@/components/shared/RatingRing";
import type { Movie } from "@/types/tmdb";

interface MovieListWidgetProps {
  title: string;
  movies: Movie[];
  href: string;
}

export function MovieListWidget({ title, movies, href }: MovieListWidgetProps) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <Link href={href} className="text-xs text-cyan-400 hover:text-cyan-300">
          See All
        </Link>
      </div>
      <div className="space-y-3">
        {movies.slice(0, 5).map((movie) => (
          <Link
            key={movie.id}
            href={`/movie/${movie.id}`}
            className="flex items-center gap-3 group"
          >
            <div className="w-12 h-16 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
              <Image
                src={getMoviePosterUrl(movie, "w200")}
                alt={movie.title}
                fill
                className="object-cover"
                unoptimized={!movie.poster_path && !movie.poster_url}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                {movie.title}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(movie.release_date)}
              </p>
            </div>
            <RatingRing rating={movie.vote_average} size={36} />
          </Link>
        ))}
      </div>
    </div>
  );
}

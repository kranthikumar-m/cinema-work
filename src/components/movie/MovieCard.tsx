import Link from "next/link";
import Image from "next/image";
import { getMoviePosterUrl, formatDate, truncate } from "@/lib/utils";
import { RatingRing } from "@/components/shared/RatingRing";
import type { Movie } from "@/types/tmdb";

interface MovieCardProps {
  movie: Movie;
  priority?: boolean;
}

export function MovieCard({ movie, priority = false }: MovieCardProps) {
  return (
    <Link href={`/movie/${movie.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-gray-900 transition-transform duration-300 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-cyan-500/10">
        <div className="aspect-[2/3] relative">
          <Image
            src={getMoviePosterUrl(movie, "w500")}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover"
            priority={priority}
            unoptimized={!movie.poster_path && !movie.poster_url}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-gray-300 line-clamp-2">
              {truncate(movie.overview, 100)}
            </p>
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <RatingRing rating={movie.vote_average} size={40} />
        </div>
      </div>
      <div className="mt-2 px-1">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
          {movie.title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatDate(movie.release_date)}
        </p>
      </div>
    </Link>
  );
}

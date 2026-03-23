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
      <div className="relative overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-deep)] transition-transform duration-300 group-hover:scale-[1.01] group-hover:shadow-[0_18px_48px_rgba(7,10,18,0.22)]">
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
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,24,39,0.88)] via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="line-clamp-2 text-xs text-[#d7dcef]">
              {truncate(movie.overview, 100)}
            </p>
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <RatingRing rating={movie.vote_average} size={40} />
        </div>
      </div>
      <div className="mt-2 px-1">
        <h3 className="truncate font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">
          {movie.title}
        </h3>
        <p className="mt-0.5 text-xs text-[var(--color-muted-strong)]">
          {formatDate(movie.release_date)}
        </p>
      </div>
    </Link>
  );
}

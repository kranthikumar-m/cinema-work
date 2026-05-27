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
    <div className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(39,44,64,0.92)_0%,rgba(29,34,51,0.9)_100%)] p-5 shadow-[0_20px_50px_rgba(7,10,18,0.18)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-text)]">
          {title}
        </h3>
        <Link href={href} className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]">
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
              <p className="truncate text-sm font-medium text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">
                {movie.title}
              </p>
              <p className="text-xs text-[var(--color-muted-strong)]">
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

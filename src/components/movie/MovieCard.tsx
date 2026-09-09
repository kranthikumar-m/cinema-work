import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getMoviePosterUrl, formatDate, truncate } from "@/lib/utils";
import { genreNames } from "@/lib/genres";
import { RatingRing } from "@/components/shared/RatingRing";
import { MovieAdminMenu } from "@/components/movie/MovieAdminControls";
import { MovieCardDropZone } from "@/components/movie/AboCalibration";
import { PosterPlaceholder } from "@/components/movie/PosterPlaceholder";
import type { Movie } from "@/types/tmdb";

interface MovieCardProps {
  movie: Movie;
  priority?: boolean;
  linkBase?: string;
}

/**
 * Gapless poster tile. At rest: the poster with the title on a bottom gradient.
 * On hover/focus: an info card (release, rating, genres, synopsis) slides up
 * over the poster. Sits edge-to-edge inside `MovieGrid` (2px gaps).
 */
export function MovieCard({ movie, priority = false, linkBase = "/movie" }: MovieCardProps) {
  const hasPoster = Boolean(movie.poster_path || movie.poster_url);
  const releaseLabel = movie.release_date ? formatDate(movie.release_date) : "Coming soon";
  const genres = genreNames(movie.genre_ids);
  const year = movie.release_date ? movie.release_date.slice(0, 4) : null;

  return (
    <div className="group relative aspect-[2/3] overflow-hidden bg-[var(--color-bg-elevated)]">
      <Link
        href={`${linkBase}/${movie.id}`}
        className="absolute inset-0 block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
        aria-label={`${movie.title}, ${releaseLabel}`}
      >
        {hasPoster ? (
          <Image
            src={getMoviePosterUrl(movie, "w500")}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.04]"
            priority={priority}
            unoptimized={!movie.poster_path}
          />
        ) : (
          <PosterPlaceholder movieId={movie.id} title={movie.title} year={year} />
        )}

        {/* Resting caption */}
        <div className="tile-overlay absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pt-12 text-center transition-opacity duration-300 motion-reduce:transition-none group-hover:opacity-0 group-focus-visible:opacity-0">
          <h3 className="line-clamp-2 font-[family-name:var(--font-heading)] text-[13px] font-semibold leading-tight text-white">
            {movie.title}
          </h3>
          <p className="mt-1 text-[10.5px] text-white/60">{releaseLabel}</p>
        </div>

        {/* Hover card */}
        <div className="tile-hover-card absolute inset-0 flex translate-y-6 flex-col justify-end p-3.5 opacity-0 transition-all duration-300 motion-reduce:transition-none group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <p className="eyebrow-label text-[var(--color-accent)]">
            {movie.release_date ? `Release · ${releaseLabel}` : "Coming soon"}
          </p>
          <div className="mt-1.5 flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-[family-name:var(--font-heading)] text-[15px] font-bold leading-tight text-white">
              {movie.title}
            </h3>
            <RatingRing rating={movie.imdb_rating ?? null} size={34} className="shrink-0" />
          </div>
          {genres.length > 0 && (
            <p className="mt-1 truncate text-[11px] text-white/65">{genres.join(" · ")}</p>
          )}
          {movie.overview && (
            <p className="mt-2 line-clamp-3 text-[11.5px] leading-snug text-white/78">
              {truncate(movie.overview, 140)}
            </p>
          )}
          <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-accent)]">
            Details
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
      <MovieAdminMenu movieId={movie.id} movieTitle={movie.title} />
      <MovieCardDropZone movieId={movie.id} movieTitle={movie.title} />
    </div>
  );
}

import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getMovieDetails,
  getMovieCredits,
  getMovieVideos,
  getMovieImages,
  getMovieReviews,
  getSimilarMovies,
  getWatchProviders,
} from "@/services/tmdb";
import {
  getImageUrl,
  getMovieBackdropUrl,
  getMoviePosterUrl,
  formatDate,
  formatRuntime,
  formatCurrency,
} from "@/lib/utils";
import { RatingRing } from "@/components/shared/RatingRing";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { CastCarousel } from "@/components/movie/CastCarousel";
import { PhotoGallery } from "@/components/movie/PhotoGallery";
import { ReviewCard } from "@/components/movie/ReviewCard";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { MovieDetailClient } from "./client";
import { enrichMovieAssets } from "@/services/telugu-movies";
import type { Metadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const movie = await getMovieDetails(Number(params.id));
    return {
      title: `${movie.title} - Telugu Cinema Updates`,
      description: movie.overview,
    };
  } catch {
    return { title: "Movie - Telugu Cinema Updates" };
  }
}

export default async function MovieDetailPage({ params }: Props) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  let movie, credits, videos, images, reviews, similar, providers;
  try {
    [movie, credits, videos, images, reviews, similar, providers] =
      await Promise.all([
        getMovieDetails(id),
        getMovieCredits(id),
        getMovieVideos(id),
        getMovieImages(id),
        getMovieReviews(id),
        getSimilarMovies(id),
        getWatchProviders(id),
      ]);

    movie = await enrichMovieAssets(movie);
  } catch {
    notFound();
  }

  const trailer = videos.results.find(
    (v) => v.type === "Trailer" && v.site === "YouTube"
  );
  const director = credits.crew.find((c) => c.job === "Director");
  const usProviders = providers.results?.US;
  const similarTeluguMovies = similar.results
    .filter((item) => item.original_language === "te")
    .slice(0, 6);

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-[50vh] min-h-[400px]">
        <Image
          src={getMovieBackdropUrl(movie, "original")}
          alt={movie.title}
          fill
          className="object-cover"
          priority
          unoptimized={!movie.backdrop_path && !movie.backdrop_url}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 -mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0">
            <div className="w-56 md:w-64 rounded-xl overflow-hidden shadow-2xl mx-auto md:mx-0">
              <Image
                src={getMoviePosterUrl(movie, "w500")}
                alt={movie.title}
                width={256}
                height={384}
                className="w-full h-auto"
                priority
                unoptimized={!movie.poster_path && !movie.poster_url}
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-4 md:pt-24">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="text-gray-400 italic mb-4">{movie.tagline}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <RatingRing rating={movie.vote_average} size={56} />
              <span className="text-sm text-gray-400">
                {movie.vote_count.toLocaleString()} votes
              </span>
              <span className="text-sm text-gray-500">|</span>
              <span className="text-sm text-gray-300">
                {formatDate(movie.release_date)}
              </span>
              <span className="text-sm text-gray-500">|</span>
              <span className="text-sm text-gray-300">
                {formatRuntime(movie.runtime)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres.map((g) => (
                <span
                  key={g.id}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                >
                  {g.name}
                </span>
              ))}
            </div>

            <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl">
              {movie.overview}
            </p>

            {/* Trailer + Details Buttons */}
            <MovieDetailClient trailerKey={trailer?.key ?? null} />

            {director && (
              <p className="text-sm text-gray-400 mt-4">
                <span className="text-gray-500">Director:</span>{" "}
                <span className="text-white">{director.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Cast */}
        <div className="mt-12">
          <SectionHeader title="Cast" />
          <CastCarousel cast={credits.cast} />
        </div>

        {/* Photos */}
        {images.backdrops.length > 0 && (
          <div className="mt-12">
            <SectionHeader title="Photos" />
            <PhotoGallery images={images.backdrops} title={movie.title} />
          </div>
        )}

        {/* Watch Providers */}
        {usProviders && (usProviders.flatrate || usProviders.rent || usProviders.buy) && (
          <div className="mt-12">
            <SectionHeader title="Where to Watch" />
            <div className="flex flex-wrap gap-4">
              {[
                ...(usProviders.flatrate || []),
                ...(usProviders.rent || []),
                ...(usProviders.buy || []),
              ]
                .filter(
                  (p, i, arr) =>
                    arr.findIndex((x) => x.provider_id === p.provider_id) === i
                )
                .slice(0, 10)
                .map((p) => (
                  <div
                    key={p.provider_id}
                    className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2"
                  >
                    <Image
                      src={getImageUrl(p.logo_path, "w200")}
                      alt={p.provider_name}
                      width={32}
                      height={32}
                      className="rounded"
                      unoptimized
                    />
                    <span className="text-sm text-gray-300">
                      {p.provider_name}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.results.length > 0 && (
          <div className="mt-12">
            <SectionHeader title="Reviews" />
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.results.slice(0, 4).map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          </div>
        )}

        {/* Facts Panel */}
        <div className="mt-12">
          <SectionHeader title="Movie Facts" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Status", value: movie.status },
              { label: "Language", value: movie.original_language.toUpperCase() },
              { label: "Budget", value: formatCurrency(movie.budget) },
              { label: "Revenue", value: formatCurrency(movie.revenue) },
            ].map((fact) => (
              <div
                key={fact.label}
                className="bg-gray-900/60 border border-gray-800 rounded-xl p-4"
              >
                <p className="text-xs text-gray-500 mb-1">{fact.label}</p>
                <p className="text-sm font-medium text-white">{fact.value}</p>
              </div>
            ))}
          </div>
          {movie.production_companies.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {movie.production_companies.map((c) => (
                <span
                  key={c.id}
                  className="text-xs text-gray-400 bg-gray-900 px-3 py-1.5 rounded-lg"
                >
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Similar Movies */}
        {similarTeluguMovies.length > 0 && (
          <div className="mt-12 pb-12">
            <SectionHeader title="Similar Movies" />
            <MovieGrid
              movies={similarTeluguMovies}
              columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            />
          </div>
        )}
      </div>
    </div>
  );
}

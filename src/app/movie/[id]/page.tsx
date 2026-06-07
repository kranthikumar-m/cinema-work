import { Suspense } from "react";
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
  getBackdropUrl,
  getMoviePosterUrl,
  formatDate,
  formatRuntime,
  formatCurrency,
} from "@/lib/utils";
import { RatingRing } from "@/components/shared/RatingRing";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { CastCarousel } from "@/components/movie/CastCarousel";
import { PhotoGallery } from "@/components/movie/PhotoGallery";
import type { GalleryImage } from "@/components/movie/PhotoGallery";
import { ReviewCard } from "@/components/movie/ReviewCard";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { MovieDetailClient } from "./client";
import { enrichMovieAssets, getMovieDetailsWithFallback } from "@/services/telugu-movies";
import { attachImdbRating } from "@/services/omdb";
import { resolvePreferredBackdrop } from "@/services/movie-backdrops";
import { getMovieMusic, type MovieMusic } from "@/services/movie-music";
import { getMovieTrailers, type MovieTrailerVideo } from "@/services/movie-trailers";
import { getMovieIndiaOttProviders, type OttProvider } from "@/services/telugu-ott";
import {
  getCustomImageRecordsByMovieId,
  listMovieVideoRecords,
  listHiddenVideoKeys,
  getMovieReleaseOverrideRecord,
  hasDatabaseConfiguration,
} from "@/lib/database";
import { VideoSection } from "@/components/movie/VideoSection";
import type { VideoItem } from "@/components/movie/VideoSection";
import type { MovieImage, WatchProvider, WatchProviderResult } from "@/types/tmdb";
import type { Metadata } from "next";

interface Props {
  params: { id: string };
}

function pickHeroBackdropPath(backdrops: MovieImage[]): string | null {
  if (!backdrops?.length) return null;

  const best = [...backdrops]
    .filter((img) => img.file_path && (img.aspect_ratio || 0) >= 1)
    .sort((a, b) => {
      if ((b.aspect_ratio || 0) !== (a.aspect_ratio || 0))
        return (b.aspect_ratio || 0) - (a.aspect_ratio || 0);
      if (b.width !== a.width) return b.width - a.width;
      return (b.vote_average || 0) - (a.vote_average || 0);
    })[0];

  return best?.file_path ?? null;
}

// Dedupes a region's providers across all monetization tiers (subscription,
// free, ad-supported, rent, buy) into a single ordered list for display.
function flattenWatchProviders(
  region: WatchProviderResult | undefined
): WatchProvider[] {
  if (!region) return [];
  const all = [
    ...(region.flatrate || []),
    ...(region.free || []),
    ...(region.ads || []),
    ...(region.rent || []),
    ...(region.buy || []),
  ];
  return all
    .filter((p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i)
    .slice(0, 12);
}

function shouldUseUnoptimizedImage(src: string) {
  // Local assets (e.g. placeholder SVGs) bypass the optimizer, and any
  // non-TMDB remote URL (Google fallbacks) isn't covered by our config.
  if (src.startsWith("/")) return true;
  return /^https?:\/\//i.test(src) && !src.includes("image.tmdb.org");
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
        getMovieDetailsWithFallback(id),
        getMovieCredits(id),
        getMovieVideos(id),
        getMovieImages(id),
        getMovieReviews(id),
        getSimilarMovies(id),
        getWatchProviders(id),
      ]);

    movie = await enrichMovieAssets(movie);
    movie = await attachImdbRating(movie);
  } catch {
    notFound();
  }

  const director = credits.crew.find((c) => c.job === "Director");
  const similarTeluguMovies = similar.results
    .filter((item) => item.original_language === "te")
    .slice(0, 6);
  const backdropSelection = await resolvePreferredBackdrop(movie, movie.backdrop_path);
  const [customImages, customVideoRows, music, autoTrailers, hiddenKeyList, releaseOverride] =
    await Promise.all([
      hasDatabaseConfiguration()
        ? getCustomImageRecordsByMovieId(id)
        : Promise.resolve([]),
      hasDatabaseConfiguration()
        ? listMovieVideoRecords(id)
        : Promise.resolve([]),
      getMovieMusic(
        id,
        movie.title,
        movie.release_date || null,
        movie.original_language === "te"
      ).catch((): MovieMusic => ({ album: null, songs: [] })),
      getMovieTrailers(id, movie.title, movie.original_language === "te").catch(
        (): MovieTrailerVideo[] => []
      ),
      hasDatabaseConfiguration()
        ? listHiddenVideoKeys(id)
        : Promise.resolve([] as string[]),
      hasDatabaseConfiguration()
        ? getMovieReleaseOverrideRecord(id)
        : Promise.resolve(null),
    ]);

  // Apply admin ABO calibration: corrected release date + alias tags.
  const releaseDateDisplay = releaseOverride?.release_date || movie.release_date;
  let aliasTags: string[] = [];
  if (releaseOverride?.aliases) {
    try {
      const parsed = JSON.parse(releaseOverride.aliases);
      if (Array.isArray(parsed)) aliasTags = parsed.filter((a) => typeof a === "string");
    } catch {
      /* ignore malformed */
    }
  }
  // Watch providers as separate region groups. India = TMDB IN providers PLUS
  // 123telugu OTT data (matched by title/alias, given TMDB logos); US = TMDB only.
  const toOttProviders = (list: WatchProvider[]): OttProvider[] =>
    list.map((p) => ({ name: p.provider_name, logoPath: p.logo_path }));
  const indiaFrom123 = await getMovieIndiaOttProviders(movie.title, aliasTags).catch(
    () => [] as OttProvider[]
  );
  const dedupeProviders = (list: OttProvider[]): OttProvider[] => {
    const seen = new Set<string>();
    return list.filter((p) => {
      const key = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const watchRegions = [
    {
      code: "IN",
      label: "India",
      providers: dedupeProviders([
        ...toOttProviders(flattenWatchProviders(providers.results?.IN)),
        ...indiaFrom123,
      ]),
    },
    {
      code: "US",
      label: "United States",
      providers: toOttProviders(flattenWatchProviders(providers.results?.US)),
    },
  ].filter((region) => region.providers.length > 0);

  const hiddenKeys = new Set(hiddenKeyList);
  const customBackdrop = customImages.find((r) => r.image_type === "backdrop");
  const customPoster = customImages.find((r) => r.image_type === "poster");

  const hasTmdbBackdrops = (images?.backdrops ?? []).length > 0;
  const heroBackdropPath =
    pickHeroBackdropPath(images?.backdrops ?? []) ??
    backdropSelection.backdropPath ??
    movie.backdrop_path ??
    null;
  const heroImage = hasTmdbBackdrops && heroBackdropPath
    ? getBackdropUrl(heroBackdropPath, "w1280")
    : customBackdrop
      ? `/api/images/custom/${id}/backdrop`
      : heroBackdropPath
        ? getBackdropUrl(heroBackdropPath, "w1280")
        : getMoviePosterUrl(movie, "w1280") ||
          backdropSelection.imageUrl ||
          null;
  const heroIsRemote = heroImage ? /^https?:\/\//i.test(heroImage) : false;
  const posterImage = customPoster
    ? `/api/images/custom/${id}/poster`
    : getMoviePosterUrl(movie, "w500");

  const customGalleryImages: GalleryImage[] = [];
  if (customBackdrop) {
    const url = `/api/images/custom/${id}/backdrop`;
    customGalleryImages.push({ thumbnailUrl: url, fullUrl: url, label: "Custom Backdrop", aspectRatio: 16 / 9 });
  }
  if (customPoster) {
    const url = `/api/images/custom/${id}/poster`;
    customGalleryImages.push({ thumbnailUrl: url, fullUrl: url, label: "Custom Poster", aspectRatio: 2 / 3 });
  }
  const hasPhotos = images.backdrops.length > 0 || images.posters.length > 0 || customGalleryImages.length > 0;

  const tmdbVideoTypeToCategory = (type: string, name: string): string => {
    const lower = type.toLowerCase();
    if (lower === "trailer") return "trailer";
    if (lower === "teaser") return "teaser";
    const nameLower = name.toLowerCase();
    if (nameLower.includes("song") || nameLower.includes("lyric") || nameLower.includes("music video")) return "song";
    return "miscellaneous";
  };

  // Assemble the detail-page videos from authoritative sources, deduped by key:
  //   • Trailers/teasers  → getMovieTrailers (TMDB, else auto-fetched)
  //   • Songs             → getMovieMusic (mirrors the /music page exactly, so
  //                          stale TMDB / service-persisted song rows never show)
  //   • Reviews / misc    → TMDB
  //   • Admin-curated     → movie_videos rows an admin explicitly added/fixed
  //                          (added_by_user_id set); these win and carry a
  //                          recordId so admins can manage them.
  // Hidden keys (admin "Remove") are filtered out everywhere.
  const adminCustomItems: VideoItem[] = customVideoRows
    .filter((r) => r.added_by_user_id != null)
    .map((r) => ({
      key: r.youtube_key,
      title: r.title,
      category: r.category,
      source: "custom" as const,
      recordId: r.id,
    }));

  const trailerItems: VideoItem[] = autoTrailers.map((t) => ({
    key: t.youtubeKey,
    title: t.title,
    category: t.category,
    source: "tmdb" as const,
  }));

  const songItems: VideoItem[] = music.songs
    .filter((s) => s.youtubeKey)
    .map((s) => ({
      key: s.youtubeKey as string,
      title: s.title,
      category: "song",
      source: "tmdb" as const,
    }));

  const otherTmdbItems: VideoItem[] = videos.results
    .filter((v) => v.site === "YouTube" && v.key)
    .map((v) => ({
      key: v.key,
      title: v.name,
      category: tmdbVideoTypeToCategory(v.type, v.name),
      source: "tmdb" as const,
    }))
    .filter((v) => v.category === "review" || v.category === "miscellaneous");

  const videosByKey = new Map<string, VideoItem>();
  for (const item of [...adminCustomItems, ...trailerItems, ...songItems, ...otherTmdbItems]) {
    if (hiddenKeys.has(item.key)) continue;
    if (!videosByKey.has(item.key)) videosByKey.set(item.key, item);
  }
  const allVideos = Array.from(videosByKey.values());

  const firstTrailer =
    allVideos.find((v) => v.category === "trailer") ??
    allVideos.find((v) => v.category === "teaser");
  const trailerKey = firstTrailer?.key ?? null;

  return (
    <div>
      {/* Hero with backdrop background */}
      <div className="relative min-h-[100dvh] bg-gray-950">
        {/* Backdrop image */}
        {heroImage ? (
          <Image
            src={heroImage}
            alt={movie.title}
            fill
            className="object-cover"
            priority
            unoptimized={heroIsRemote || shouldUseUnoptimizedImage(heroImage)}
          />
        ) : null}
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-gray-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-transparent to-transparent" />

        {/* Movie info overlaid on backdrop */}
        <div
          id="overview"
          className="relative z-10 flex min-h-[100dvh] items-end scroll-mt-[170px]"
        >
          <div className="app-page-shell-detail w-full pb-12 pt-24">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Poster */}
              <div className="flex-shrink-0">
                <div className="w-48 md:w-56 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 mx-auto md:mx-0">
                  <Image
                    src={posterImage}
                    alt={movie.title}
                    width={224}
                    height={336}
                    className="w-full h-auto"
                    priority
                    unoptimized={shouldUseUnoptimizedImage(posterImage)}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                  {movie.title}
                </h1>
                {movie.tagline && (
                  <p className="text-gray-300 italic mb-4 drop-shadow">{movie.tagline}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <RatingRing rating={movie.imdb_rating ?? null} size={56} />
                  {movie.imdb_votes ? (
                    <>
                      <span className="text-sm text-gray-300">
                        {movie.imdb_votes.toLocaleString()} IMDb votes
                      </span>
                      <span className="text-sm text-gray-500">|</span>
                    </>
                  ) : null}
                  <span className="text-sm text-gray-200">
                    {releaseDateDisplay ? formatDate(releaseDateDisplay) : "Coming soon"}
                  </span>
                  <span className="text-sm text-gray-500">|</span>
                  <span className="text-sm text-gray-200">
                    {formatRuntime(movie.runtime)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  {movie.genres.map((g) => (
                    <span
                      key={g.id}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-sm"
                    >
                      {g.name}
                    </span>
                  ))}
                  {aliasTags.map((alias) => (
                    <span
                      key={alias}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] border border-[rgba(194,154,98,0.4)] backdrop-blur-sm"
                      title="Alternate title"
                    >
                      {alias}
                    </span>
                  ))}
                </div>

                <p className="text-gray-200 leading-relaxed mb-6 max-w-2xl drop-shadow">
                  {movie.overview}
                </p>

                <MovieDetailClient trailerKey={trailerKey} videos={allVideos} />

                {director && (
                  <p className="text-sm text-gray-300 mt-4">
                    <span className="text-gray-400">Director:</span>{" "}
                    <span className="text-white font-medium">{director.name}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="app-page-shell-detail">

        {/* Cast */}
        <div className="mt-12">
          <SectionHeader title="Cast" />
          <CastCarousel cast={credits.cast} />
        </div>

        {/* Videos */}
        {allVideos.length > 0 && (
          <div id="videos" className="mt-12 scroll-mt-[100px]">
            <SectionHeader title="Videos" />
            <Suspense fallback={null}>
              <VideoSection videos={allVideos} movieId={id} movieTitle={movie.title} />
            </Suspense>
          </div>
        )}

        {/* Photos */}
        {hasPhotos && (
          <div className="mt-12">
            <SectionHeader title="Photos" />
            <PhotoGallery
              images={images.backdrops}
              posterImages={images.posters}
              title={movie.title}
              extraImages={customGalleryImages}
            />
          </div>
        )}

        {/* Watch Providers — grouped by region (India OTT, then US). */}
        {watchRegions.length > 0 && (
          <div className="mt-12">
            <SectionHeader title="Where to Watch" />
            <div className="space-y-5">
              {watchRegions.map((region) => (
                <div key={region.code}>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                    {region.label}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {region.providers.map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2"
                      >
                        {p.logoPath && (
                          <Image
                            src={getImageUrl(p.logoPath, "w200")}
                            alt={p.name}
                            width={32}
                            height={32}
                            className="rounded"
                            unoptimized
                          />
                        )}
                        <span className="text-sm text-gray-300">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <section id="reviews" className="mt-12 scroll-mt-[170px]">
          <SectionHeader title="Reviews" />
          {reviews.results.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.results.slice(0, 4).map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.48)] px-5 py-6 text-sm text-[var(--color-muted-strong)]">
              Critic and audience reviews have not been published for this title yet.
            </div>
          )}
        </section>

        {/* Facts Panel */}
        <section id="box-office" className="mt-12 scroll-mt-[170px]">
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
        </section>

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

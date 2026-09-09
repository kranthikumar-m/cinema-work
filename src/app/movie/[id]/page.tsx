import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getMovieDetails,
  getMovieCredits,
  getMovieVideos,
  getMovieImages,
  getMovieReviews,
  getSimilarMovies,
  getMovieRecommendations,
  getWatchProviders,
  getMovieKeywords,
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
import { CrewList } from "@/components/movie/CrewList";
import { ImdbCastCarousel } from "@/components/movie/ImdbCredits";
import { MovieCreditsPanel } from "@/components/movie/MovieCreditsPanel";
import { PhotoGallery } from "@/components/movie/PhotoGallery";
import type { GalleryImage } from "@/components/movie/PhotoGallery";
import { ReviewCard } from "@/components/movie/ReviewCard";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { MovieSongs } from "@/components/movie/MovieSongs";
import { NewsCard } from "@/components/news/NewsCard";
import { MovieDetailClient } from "./client";
import {
  enrichMovieAssets,
  getMovieDetailsWithFallback,
  getPopularTeluguMovies,
} from "@/services/telugu-movies";
import { attachImdbRating, getImdbTitleExtras, getImdbFullCredits } from "@/services/omdb";
import { resolvePreferredBackdrop } from "@/services/movie-backdrops";
import { getMovieMusic, type MovieMusic } from "@/services/movie-music";
import { getMovieTrailers, type MovieTrailerVideo } from "@/services/movie-trailers";
import { getMovieIndiaOttProviders, type OttProvider } from "@/services/telugu-ott";
import { getMovieRelatedNews, type NewsItem } from "@/services/telugu-news";
import { MovieDetailsAdminEditor } from "@/components/movie/MovieDetailsAdminEditor";
import {
  getCustomImageRecordsByMovieId,
  listMovieVideoRecords,
  listHiddenVideoKeys,
  getMovieReleaseOverrideRecord,
  getMovieDetailOverrideRecord,
  hasDatabaseConfiguration,
} from "@/lib/database";
import { VideoSection } from "@/components/movie/VideoSection";
import type { VideoItem } from "@/components/movie/VideoSection";
import type { Movie, MovieImage, WatchProvider, WatchProviderResult } from "@/types/tmdb";
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

function CompanyGroup({
  label,
  items,
}: {
  label: string;
  items: { name: string; detail: string | null }[];
}) {
  if (!items.length) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.5)]">
      <p className="border-b border-[var(--color-border)] px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
        {label}
      </p>
      <ul>
        {items.map((company, index) => (
          <li
            key={`${company.name}-${index}`}
            className={`flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-[rgba(26,167,230,0.06)] ${
              index ? "border-t border-[var(--color-border)]" : ""
            }`}
          >
            <span className="text-sm font-medium text-[var(--color-text)]">{company.name}</span>
            {company.detail && (
              <span className="shrink-0 text-xs text-[var(--color-muted)]">{company.detail}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
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

  let movie, credits, videos, images, reviews, similar, recommendations, providers;
  try {
    [movie, credits, videos, images, reviews, similar, recommendations, providers] =
      await Promise.all([
        getMovieDetailsWithFallback(id),
        getMovieCredits(id),
        getMovieVideos(id),
        getMovieImages(id),
        getMovieReviews(id),
        getSimilarMovies(id),
        getMovieRecommendations(id).catch(() => ({ results: [] as Movie[] })),
        getWatchProviders(id),
      ]);

    movie = await enrichMovieAssets(movie);
    movie = await attachImdbRating(movie);
  } catch {
    notFound();
  }

  const director = credits.crew.find((c) => c.job === "Director");
  // Always populate "Similar Movies" so the section is consistent across titles:
  // TMDB similar + recommendations (Telugu), then a popular-Telugu fallback.
  const similarTeluguMovies: Movie[] = [];
  const similarSeen = new Set<number>([id]);
  for (const item of [...similar.results, ...recommendations.results]) {
    if (similarTeluguMovies.length >= 6) break;
    if (item.original_language !== "te" || similarSeen.has(item.id)) continue;
    similarSeen.add(item.id);
    similarTeluguMovies.push(item);
  }
  if (similarTeluguMovies.length < 6) {
    const popular = await getPopularTeluguMovies(14).catch(() => [] as Movie[]);
    for (const item of popular) {
      if (similarTeluguMovies.length >= 6) break;
      if (similarSeen.has(item.id)) continue;
      similarSeen.add(item.id);
      similarTeluguMovies.push(item);
    }
  }
  const backdropSelection = await resolvePreferredBackdrop(movie, movie.backdrop_path);
  const [
    customImages,
    customVideoRows,
    music,
    autoTrailers,
    hiddenKeyList,
    releaseOverride,
    keywordData,
    imdbExtras,
    detailOverride,
    imdbCredits,
  ] = await Promise.all([
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
      getMovieKeywords(id).catch(() => ({ keywords: [] })),
      getImdbTitleExtras(movie.imdb_id).catch(() => null),
      hasDatabaseConfiguration()
        ? getMovieDetailOverrideRecord(id)
        : Promise.resolve(null),
      getImdbFullCredits(movie.imdb_id).catch(() => null),
    ]);

  // Plot keywords shown as tags next to genres (Title Cased for display).
  const keywordTags = (keywordData.keywords ?? [])
    .slice(0, 8)
    .map((k) => k.name.replace(/\b\w/g, (c) => c.toUpperCase()));
  const spokenLanguages = (movie.spoken_languages ?? [])
    .map((l) => l.english_name || l.name)
    .filter(Boolean);
  const countries = (movie.production_countries ?? []).map((c) => c.name).filter(Boolean);

  // Details + tech specs (IMDb-sourced fields shown only when available).
  const ex = imdbExtras;
  const factRows: { label: string; values: string[]; chips?: boolean }[] = [
    { label: "Status", values: [movie.status || "—"] },
    {
      label: "Languages",
      values: spokenLanguages.length ? spokenLanguages : [movie.original_language.toUpperCase()],
      chips: true,
    },
    ...(countries.length ? [{ label: "Country", values: countries, chips: true }] : []),
    { label: "Runtime", values: [formatRuntime(movie.runtime)] },
    ...(ex?.color ? [{ label: "Color", values: [ex.color] }] : []),
    ...(ex?.soundMixes.length ? [{ label: "Sound Mix", values: ex.soundMixes, chips: true }] : []),
    ...(ex?.aspectRatios.length
      ? [{ label: "Aspect Ratio", values: ex.aspectRatios, chips: true }]
      : []),
    ...(ex?.cameras.length ? [{ label: "Camera", values: ex.cameras }] : []),
    ...(ex?.negativeFormats.length
      ? [{ label: "Negative Format", values: ex.negativeFormats, chips: true }]
      : []),
    ...(ex?.cinematographicProcesses.length
      ? [{ label: "Cinematographic Process", values: ex.cinematographicProcesses, chips: true }]
      : []),
    ...(ex?.printedFormats.length
      ? [{ label: "Printed Film Format", values: ex.printedFormats, chips: true }]
      : []),
    { label: "Budget", values: [formatCurrency(movie.budget)] },
    { label: "Revenue", values: [formatCurrency(movie.revenue)] },
  ];
  // Production companies: merge TMDB + IMDb (IMDb is often more complete),
  // deduped by normalized name.
  const productionCompanies = (() => {
    const seen = new Set<string>();
    const out: { name: string; detail: string | null }[] = [];
    for (const c of [
      ...movie.production_companies.map((p) => ({ name: p.name, detail: null })),
      ...(imdbExtras?.productionCompanies ?? []),
    ]) {
      const key = c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  })();
  const distributors = imdbExtras?.distributors ?? [];
  const otherCompanies = imdbExtras?.otherCompanies ?? [];

  // Admin overrides (full snapshots) replace the auto-sourced data when present.
  let detailFacts: { label: string; values: string[]; chips?: boolean }[] = factRows;
  let companyCredits = {
    production: productionCompanies,
    distributors,
    other: otherCompanies,
  };
  if (detailOverride?.facts) {
    try {
      const parsed = JSON.parse(detailOverride.facts);
      if (Array.isArray(parsed)) {
        detailFacts = parsed.filter(
          (r) => r && typeof r.label === "string" && Array.isArray(r.values)
        );
      }
    } catch {
      /* ignore malformed */
    }
  }
  if (detailOverride?.companies) {
    try {
      const parsed = JSON.parse(detailOverride.companies);
      if (parsed && typeof parsed === "object") {
        companyCredits = {
          production: Array.isArray(parsed.production) ? parsed.production : [],
          distributors: Array.isArray(parsed.distributors) ? parsed.distributors : [],
          other: Array.isArray(parsed.other) ? parsed.other : [],
        };
      }
    } catch {
      /* ignore malformed */
    }
  }
  const hasDetailOverride = Boolean(detailOverride?.facts || detailOverride?.companies);

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
  const [indiaFrom123, movieNews] = await Promise.all([
    getMovieIndiaOttProviders(movie.title, aliasTags).catch(() => [] as OttProvider[]),
    getMovieRelatedNews(movie.title, aliasTags).catch(() => [] as NewsItem[]),
  ]);
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
                      className="px-3 py-1 text-xs font-medium rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] border border-[rgba(26,167,230,0.4)] backdrop-blur-sm"
                      title="Alternate title"
                    >
                      {alias}
                    </span>
                  ))}
                  {keywordTags.map((kw) => (
                    <span
                      key={kw}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-white/5 text-gray-300 border border-white/10 backdrop-blur-sm"
                    >
                      {kw}
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
                    <Link
                      href={`/person/${director.id}`}
                      className="font-medium text-white transition-colors hover:text-[var(--color-accent)]"
                    >
                      {director.name}
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="app-page-shell-detail">

        {/* Cast & Crew — full cast from IMDb (billing order), falling back to TMDB. */}
        <div id="cast-crew" className="mt-12 scroll-mt-[150px]">
          <SectionHeader title="Cast" />
          {imdbCredits && imdbCredits.cast.length > 0 ? (
            <ImdbCastCarousel cast={imdbCredits.cast} />
          ) : (
            <CastCarousel cast={credits.cast} />
          )}
        </div>

        {/* Crew — key roles inline (Movie Facts style) + full cast & crew popup. */}
        {((imdbCredits && imdbCredits.crew.length > 0) || credits.crew.length > 0) && (
          <div className="mt-12">
            <SectionHeader title="Crew" />
            {imdbCredits && imdbCredits.crew.length > 0 ? (
              <MovieCreditsPanel
                cast={imdbCredits.cast}
                crew={imdbCredits.crew}
                title={movie.title}
              />
            ) : (
              <CrewList crew={credits.crew} />
            )}
          </div>
        )}

        {/* Songs — dedicated soundtrack track list (also reachable at /music/[id]) */}
        {music.songs.length > 0 && (
          <div id="songs" className="mt-12 scroll-mt-[150px]">
            <SectionHeader title="Songs" />
            <MovieSongs
              music={music}
              movieId={id}
              movieTitle={movie.title}
              albumImage={posterImage}
            />
          </div>
        )}

        {/* Videos */}
        {allVideos.length > 0 && (
          <div id="videos" className="mt-12 scroll-mt-[100px]">
            <SectionHeader title="Videos" />
            <Suspense fallback={null}>
              <VideoSection videos={allVideos} movieId={id} movieTitle={movie.title} />
            </Suspense>
          </div>
        )}

        {/* Gallery */}
        {hasPhotos && (
          <div id="gallery" className="mt-12 scroll-mt-[150px]">
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

        {/* News — recent Telugu coverage mentioning this title (links out to source) */}
        {movieNews.length > 0 && (
          <section id="news" className="mt-12 scroll-mt-[150px]">
            <SectionHeader title="News" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {movieNews.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Facts Panel — clean definition rows with chips for multi-value fields */}
        <section id="box-office" className="mt-12 scroll-mt-[170px]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-text)] md:text-2xl">
              Movie Facts
            </h2>
            <MovieDetailsAdminEditor
              movieId={id}
              facts={detailFacts.map((r) => ({ label: r.label, values: r.values }))}
              companies={companyCredits}
              hasOverride={hasDetailOverride}
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.5)] sm:grid sm:grid-cols-2">
            {detailFacts.map((row) => (
              <div
                key={row.label}
                className="group flex items-start gap-4 border-b border-[var(--color-border)] px-5 py-3.5 transition last:border-b-0 hover:bg-[rgba(26,167,230,0.06)] sm:odd:border-r sm:last:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
              >
                <span className="w-36 shrink-0 pt-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[var(--color-muted)]">
                  {row.label}
                </span>
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  {(row.chips ?? row.values.length > 1) ? (
                    row.values.map((v) => (
                      <span
                        key={v}
                        className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-[var(--color-text)]"
                      >
                        {v}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-medium text-[var(--color-text)]">
                      {row.values.join(" · ")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Company Credits — Production (TMDB+IMDb), Distributors & Other (IMDb) */}
        {(companyCredits.production.length > 0 ||
          companyCredits.distributors.length > 0 ||
          companyCredits.other.length > 0) && (
          <section className="mt-12">
            <SectionHeader title="Company Credits" />
            <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
              <CompanyGroup label="Production" items={companyCredits.production} />
              <CompanyGroup label="Distributors" items={companyCredits.distributors} />
              <CompanyGroup label="Other Companies" items={companyCredits.other} />
            </div>
          </section>
        )}

        {/* Similar Movies */}
        {similarTeluguMovies.length > 0 && (
          <div id="similar" className="mt-12 pb-12 scroll-mt-[150px]">
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

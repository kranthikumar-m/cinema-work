import {
  getMovieCredits,
  getMovieDetails,
  getMovieImages,
  getMovieVideos,
} from "@/services/tmdb";
import { resolvePreferredBackdrop } from "@/services/movie-backdrops";
import {
  getCustomImageRecordsByMovieId,
  hasDatabaseConfiguration,
  listMovieVideoRecords,
  listHiddenVideoKeys,
} from "@/lib/database";
import { getMovieTrailers } from "@/services/movie-trailers";
import {
  getLatestTeluguReleases,
  getPopularTeluguMovies,
  getTopRatedTeluguMovies,
  getUpcomingTeluguMovies,
} from "@/services/telugu-movies";
import { getManuallyAddedMovies, mergeUnique } from "@/services/manual-movies";
import { attachImdbRatings } from "@/services/omdb";
import { HomeLandingHero } from "@/components/home/HomeLandingHero";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { MovieListWidget } from "@/components/movie/SidebarWidgets";
import { FeaturedArticleCard } from "@/components/movie/FeaturedArticleCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { articles } from "@/data/editorial";
import { featuredHomepageHeroSeed } from "@/data/homepage";
import { formatRuntime } from "@/lib/utils";
import type { HomepageHeroItem, HomepageHeroSlide } from "@/types/homepage";
import type { Credits, Movie, Video } from "@/types/tmdb";

export const dynamic = "force-dynamic";

const HERO_SLIDE_TARGET = 5;
const HERO_CANDIDATE_LIMIT = 12;

function formatReleaseLabel(dateString: string) {
  if (!dateString) return "Coming Soon";

  // Render the date-only release string as a calendar date (UTC) so it doesn't
  // slip to the prior day in a behind-UTC environment.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString.trim());
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(isDateOnly ? { timeZone: "UTC" } : {}),
  });
}

function dedupeMovies(collections: Movie[][]) {
  const seen = new Set<number>();
  const deduped: Movie[] = [];

  collections.forEach((movies) => {
    movies.forEach((movie) => {
      if (seen.has(movie.id)) return;

      seen.add(movie.id);
      deduped.push(movie);
    });
  });

  return deduped;
}

function getDirector(credits: Credits | null) {
  return (
    credits?.crew.find((member) => member.job === "Director")?.name ||
    "Details coming soon"
  );
}

function getActors(credits: Credits | null) {
  const actors = credits?.cast.slice(0, 3).map((member) => member.name) || [];
  return actors.length ? actors : ["Cast details coming soon"];
}

function getTrailerInfo(videos: { results: Video[] } | null, movieId?: number) {
  // Only ever surface an actual Trailer/Teaser — never an arbitrary YouTube
  // video, which is how songs (e.g. a movie with no TMDB trailer) used to leak
  // into the hero "Trailers" button.
  const youtube = (videos?.results ?? []).filter((v) => v.site === "YouTube" && v.key);
  const trailer =
    youtube.find((v) => v.type === "Trailer" && v.official) ||
    youtube.find((v) => v.type === "Trailer") ||
    youtube.find((v) => v.type === "Teaser" && v.official) ||
    youtube.find((v) => v.type === "Teaser");

  if (trailer) {
    return { href: `https://www.youtube.com/watch?v=${trailer.key}`, key: trailer.key };
  }

  if (movieId) {
    return { href: `/movie/${movieId}`, key: null };
  }

  return { href: "/videos", key: null };
}

function isUsableHeroMovie(movie: Movie | null) {
  return Boolean(movie?.id && movie.title?.trim());
}

function isUsableHeroSlide(slide: HomepageHeroSlide | null) {
  return Boolean(
    slide?.item.id &&
      slide.item.title?.trim() &&
      slide.item.watchHref &&
      slide.item.trailerHref
  );
}

function selectHeroCandidates(collections: {
  latestReleases: Movie[];
  popular: Movie[];
  topRated: Movie[];
  upcoming: Movie[];
}) {
  return dedupeMovies([
    collections.latestReleases,
    collections.popular,
    collections.topRated,
    collections.upcoming,
  ])
    .filter(isUsableHeroMovie)
    .slice(0, HERO_CANDIDATE_LIMIT);
}

async function getMovieEnhancements(movie: Movie | null) {
  if (!movie) {
    return {
      details: null,
      credits: null,
      videos: null,
    };
  }

  const [detailsResult, creditsResult, videosResult] = await Promise.allSettled([
    getMovieDetails(movie.id),
    getMovieCredits(movie.id),
    getMovieVideos(movie.id),
  ]);

  return {
    details: detailsResult.status === "fulfilled" ? detailsResult.value : null,
    credits: creditsResult.status === "fulfilled" ? creditsResult.value : null,
    videos: videosResult.status === "fulfilled" ? videosResult.value : null,
  };
}

async function buildFallbackFeatureBundle(): Promise<HomepageHeroSlide> {
  return {
    item: {
      id: "featured-fallback",
      ...featuredHomepageHeroSeed,
      backdropPath: null,
      imageUrl: "/placeholder-backdrop.svg",
      watchHref: "/movies",
      trailerHref: "/videos",
      sourceMovieId: undefined,
    } satisfies HomepageHeroItem,
    overview:
      "A high-stakes Telugu feature navigating power, family, and spectacle on a massive canvas.",
    genreLabel: "Drama, Political",
    rating: null,
  } satisfies HomepageHeroSlide;
}

async function buildFeaturedBundle(movie: Movie | null): Promise<HomepageHeroSlide> {
  if (!movie) {
    return buildFallbackFeatureBundle();
  }

  const enhancements = await getMovieEnhancements(movie);
  const details = enhancements.details;
  const [heroBackdrop, tmdbImages, customImages] = await Promise.all([
    resolvePreferredBackdrop(
      movie,
      details?.backdrop_path ?? movie.backdrop_path
    ).catch(() => ({
      backdropPath: details?.backdrop_path ?? movie.backdrop_path ?? null,
      imageUrl: movie.backdrop_url ?? null,
    })),
    getMovieImages(movie.id).catch(() => ({ backdrops: [], posters: [] })),
    hasDatabaseConfiguration()
      ? getCustomImageRecordsByMovieId(movie.id)
      : Promise.resolve([]),
  ]);

  const hasTmdbBackdrops = tmdbImages.backdrops.length > 0;
  const customBackdrop = customImages.find((r) => r.image_type === "backdrop");
  const useCustomBackdrop = !hasTmdbBackdrops && !!customBackdrop;

  // Resolve the hero trailer in priority order:
  //   admin-curated trailer/teaser → TMDB trailer/teaser → auto-fetched promo.
  // Hidden keys (admin "Remove") are skipped at every step.
  const ytWatch = (key: string) => `https://www.youtube.com/watch?v=${key}`;
  let hiddenKeys = new Set<string>();
  let customVideos: Awaited<ReturnType<typeof listMovieVideoRecords>> = [];
  if (hasDatabaseConfiguration()) {
    try {
      [customVideos, hiddenKeys] = await Promise.all([
        listMovieVideoRecords(movie.id),
        listHiddenVideoKeys(movie.id).then((keys) => new Set(keys)),
      ]);
    } catch {
      /* non-critical */
    }
  }

  let trailerKey: string | null = null;
  let trailerHref = `/movie/${movie.id}`;

  const adminTrailer = customVideos.find(
    (v) =>
      (v.category === "trailer" || v.category === "teaser") &&
      v.added_by_user_id != null &&
      !hiddenKeys.has(v.youtube_key)
  );
  if (adminTrailer) {
    trailerKey = adminTrailer.youtube_key;
    trailerHref = ytWatch(adminTrailer.youtube_key);
  }

  if (!trailerKey) {
    const tmdbTrailerInfo = getTrailerInfo(enhancements.videos, movie.id);
    if (tmdbTrailerInfo.key && !hiddenKeys.has(tmdbTrailerInfo.key)) {
      trailerKey = tmdbTrailerInfo.key;
      trailerHref = tmdbTrailerInfo.href;
    }
  }

  if (!trailerKey) {
    try {
      const autoTrailers = await getMovieTrailers(
        movie.id,
        movie.title,
        movie.original_language === "te"
      );
      const best =
        autoTrailers.find((t) => t.category === "trailer" && !hiddenKeys.has(t.youtubeKey)) ??
        autoTrailers.find((t) => !hiddenKeys.has(t.youtubeKey));
      if (best) {
        trailerKey = best.youtubeKey;
        trailerHref = ytWatch(best.youtubeKey);
      }
    } catch {
      /* non-critical */
    }
  }

  return {
    item: {
      id: movie.id,
      title: movie.title,
      backdropPath: useCustomBackdrop ? null : heroBackdrop.backdropPath,
      imageUrl: useCustomBackdrop
        ? `/api/images/custom/${movie.id}/backdrop`
        : heroBackdrop.imageUrl ?? movie.backdrop_url ?? null,
      runtimeLabel: details?.runtime ? formatRuntime(details.runtime) : "Telugu Feature",
      viewsLabel: "",
      director: getDirector(enhancements.credits),
      actors: getActors(enhancements.credits),
      releaseLabel: formatReleaseLabel(movie.release_date),
      watchHref: `/movie/${movie.id}`,
      trailerHref,
      trailerKey,
      trailerLabel: "TRAILER",
      accentLinks: {
        director: `/movie/${movie.id}`,
        cast: `/movie/${movie.id}`,
        release: `/movie/${movie.id}`,
      },
      sourceMovieId: movie.id,
    } satisfies HomepageHeroItem,
    overview:
      movie.overview ||
      details?.tagline ||
      "A high-stakes Telugu feature navigating power, family, and spectacle on a massive canvas.",
    genreLabel:
      details?.genres.slice(0, 2).map((genre) => genre.name).join(", ") ||
      "Drama, Political",
    rating: movie.imdb_rating ?? null,
  } satisfies HomepageHeroSlide;
}

const TOP_RATED_MIN_VOTE_AVG = 7.0;
const TOP_RATED_MIN_VOTE_COUNT = 50;

async function getData() {
  try {
    // Latest releases and upcoming already fold in admin-added movies at the
    // service layer; only the top-rated section needs a homepage-local merge
    // because it applies its own vote-average / vote-count thresholds.
    const [latestReleasesResult, popularResult, upcomingResult, topRatedResult, manualMovies] =
      await Promise.all([
        getLatestTeluguReleases(10).catch(() => [] as Movie[]),
        getPopularTeluguMovies(10).catch(() => [] as Movie[]),
        getUpcomingTeluguMovies(10).catch(() => [] as Movie[]),
        getTopRatedTeluguMovies(10).catch(() => [] as Movie[]),
        getManuallyAddedMovies().catch(() => [] as Movie[]),
      ]);

    let latestReleases = latestReleasesResult;
    let popular = popularResult;
    let upcoming = upcomingResult;
    let topRated = topRatedResult;

    if (manualMovies.length) {
      const topRatedAdditions = manualMovies.filter(
        (m) =>
          m.vote_average >= TOP_RATED_MIN_VOTE_AVG &&
          m.vote_count >= TOP_RATED_MIN_VOTE_COUNT
      );

      topRated = mergeUnique(topRated, topRatedAdditions);
      topRated.sort((a, b) => b.vote_average - a.vote_average);
      topRated = topRated.slice(0, 10);
    }

    // Attach IMDb ratings so every rating shown on the homepage (grids, hero,
    // sidebar widgets) reflects IMDb rather than TMDB.
    [latestReleases, popular, upcoming, topRated] = await Promise.all([
      attachImdbRatings(latestReleases),
      attachImdbRatings(popular),
      attachImdbRatings(upcoming),
      attachImdbRatings(topRated),
    ]);

    const heroCandidates = selectHeroCandidates({
      latestReleases,
      popular,
      topRated,
      upcoming,
    });
    const heroSlideResults = await Promise.allSettled(
      heroCandidates.map((movie) => buildFeaturedBundle(movie))
    );
    const heroSlides = heroSlideResults
      .reduce<HomepageHeroSlide[]>((slides, result) => {
        if (result.status === "fulfilled" && isUsableHeroSlide(result.value)) {
          slides.push(result.value);
        }

        return slides;
      }, [])
      .slice(0, HERO_SLIDE_TARGET);

    if (!heroSlides.length) {
      heroSlides.push(await buildFallbackFeatureBundle());
    }

    return { heroSlides, latestReleases, popular, upcoming, topRated };
  } catch (error) {
    console.error("Failed to load homepage data:", error);
    return {
      heroSlides: [await buildFallbackFeatureBundle()],
      latestReleases: [],
      popular: [],
      upcoming: [],
      topRated: [],
    };
  }
}

export default async function HomePage() {
  const data = await getData();

  const { heroSlides, latestReleases, popular, upcoming, topRated } = data;
  const panelClass =
    "rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(39,44,64,0.92)_0%,rgba(29,34,51,0.9)_100%)] p-6 shadow-[0_24px_70px_rgba(7,10,18,0.22)] md:p-8";

  return (
    <div className="overflow-x-clip bg-[var(--color-bg)]">
      <HomeLandingHero
        slides={heroSlides}
        scrollTargetId="validated-releases-panel"
      />

      <section id="home-content" className="scroll-mt-6 py-16">
        <div className="app-page-shell">
          <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:gap-10">
            <div className="min-w-0 flex-1 space-y-10">
              <div
                id="validated-releases-panel"
                className={panelClass}
              >
                <SectionHeader
                  title="Recent Releases"
                  href="/movies"
                />
                <MovieGrid
                  movies={latestReleases}
                  columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                />
              </div>

              <div className={panelClass}>
                <SectionHeader
                  title="Telugu Cinema Stories"
                  href="/news"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {articles.slice(0, 3).map((article) => (
                    <FeaturedArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>

              <div className={panelClass}>
                <SectionHeader
                  title="Popular Telugu Picks"
                  href="/movies/popular"
                />
                <MovieGrid
                  movies={popular}
                  columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                />
              </div>

              <div className={panelClass}>
                <SectionHeader
                  title="Upcoming Telugu Releases"
                  href="/movies/upcoming"
                />
                <MovieGrid
                  movies={upcoming}
                  columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                />
              </div>
            </div>

            <div className="w-full flex-shrink-0 space-y-6 xl:w-[320px]">
              <MovieListWidget
                title="Upcoming Telugu Releases"
                movies={upcoming}
                href="/movies/upcoming"
              />
              <MovieListWidget
                title="Top Rated Telugu Movies"
                movies={topRated}
                href="/movies/top-rated"
              />
              <MovieListWidget
                title="Recent Releases"
                movies={latestReleases.slice(0, 5)}
                href="/movies"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

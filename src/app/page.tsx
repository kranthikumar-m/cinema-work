import {
  getMovieCredits,
  getMovieDetails,
  getMovieVideos,
} from "@/services/tmdb";
import { resolvePreferredBackdrop } from "@/services/movie-backdrops";
import {
  getLatestTeluguReleases,
  getPopularTeluguMovies,
  getTopRatedTeluguMovies,
  getUpcomingTeluguMovies,
} from "@/services/telugu-movies";
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

function formatReleaseLabel(dateString: string) {
  if (!dateString) return "Coming Soon";

  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function getTrailerHref(videos: { results: Video[] } | null, movieId?: number) {
  const trailer =
    videos?.results.find(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Trailer" &&
        video.official
    ) ||
    videos?.results.find(
      (video) => video.site === "YouTube" && video.type === "Trailer"
    ) ||
    videos?.results.find((video) => video.site === "YouTube");

  if (trailer) {
    return `https://www.youtube.com/watch?v=${trailer.key}`;
  }

  if (movieId) {
    return `/movie/${movieId}`;
  }

  return "/videos";
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
      watchHref: "/movies/trending",
      trailerHref: "/videos",
      sourceMovieId: undefined,
    } satisfies HomepageHeroItem,
    overview:
      "A high-stakes Telugu feature navigating power, family, and spectacle on a massive canvas.",
    genreLabel: "Drama, Political",
    rating: 9.6,
  } satisfies HomepageHeroSlide;
}

async function buildFeaturedBundle(movie: Movie | null): Promise<HomepageHeroSlide> {
  if (!movie) {
    return buildFallbackFeatureBundle();
  }

  const enhancements = await getMovieEnhancements(movie);
  const details = enhancements.details;
  const heroBackdrop = await resolvePreferredBackdrop(
    movie,
    details?.backdrop_path ?? movie.backdrop_path
  );

  return {
    item: {
      id: movie.id,
      title: movie.title,
      backdropPath: heroBackdrop.backdropPath,
      imageUrl: heroBackdrop.imageUrl ?? movie.backdrop_url ?? null,
      runtimeLabel: details?.runtime ? formatRuntime(details.runtime) : "Telugu Feature",
      viewsLabel: "",
      director: getDirector(enhancements.credits),
      actors: getActors(enhancements.credits),
      releaseLabel: formatReleaseLabel(movie.release_date),
      watchHref: `/movie/${movie.id}`,
      trailerHref: getTrailerHref(enhancements.videos, movie.id),
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
    rating: movie.vote_average || 9.6,
  } satisfies HomepageHeroSlide;
}

async function getData() {
  try {
    const [latestReleases, popular, upcoming, topRated] = await Promise.all([
      getLatestTeluguReleases(10),
      getPopularTeluguMovies(10),
      getUpcomingTeluguMovies(10),
      getTopRatedTeluguMovies(10),
    ]);

    const heroCandidates = dedupeMovies([latestReleases]).slice(0, 8);
    const heroSlideResults = await Promise.allSettled(
      heroCandidates.map((movie) => buildFeaturedBundle(movie))
    );
    const heroSlides = heroSlideResults
      .reduce<HomepageHeroSlide[]>((slides, result) => {
        if (result.status === "fulfilled") {
          slides.push(result.value);
        }

        return slides;
      }, [])
      .slice(0, 5);

    if (!heroSlides.length) {
      heroSlides.push(await buildFallbackFeatureBundle());
    }

    return { heroSlides, latestReleases, popular, upcoming, topRated };
  } catch (error) {
    console.error("Failed to load homepage data:", error);
    return null;
  }
}

export default async function HomePage() {
  const data = await getData();

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">
            Unable to load content
          </h2>
          <p className="text-[var(--color-muted-strong)]">
            Please check that the TMDB_API_KEY environment variable is set
            correctly.
          </p>
        </div>
      </div>
    );
  }

  const { heroSlides, latestReleases, popular, upcoming, topRated } = data;
  const panelClass =
    "rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(39,44,64,0.92)_0%,rgba(29,34,51,0.9)_100%)] p-6 shadow-[0_24px_70px_rgba(7,10,18,0.22)] md:p-8";

  return (
    <div className="overflow-x-clip bg-[var(--color-bg)]">
      <HomeLandingHero slides={heroSlides} />

      <section id="home-content" className="px-5 py-16 md:px-8 xl:px-14">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:gap-10">
            <div className="min-w-0 flex-1 space-y-10">
              <div className={panelClass}>
                <SectionHeader
                  title="Validated Telugu Releases"
                  href="/movies/trending"
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
                title="Recently Validated"
                movies={latestReleases.slice(0, 5)}
                href="/movies/trending"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

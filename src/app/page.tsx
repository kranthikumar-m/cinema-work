import {
  getTrending,
  getPopular,
  getUpcoming,
  getTopRated,
  getNowPlaying,
  getMovieCredits,
  getMovieDetails,
  getMovieVideos,
  searchMovies,
} from "@/services/tmdb";
import { HomeHeroBanner } from "@/components/home/HomeHeroBanner";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { MovieListWidget } from "@/components/movie/SidebarWidgets";
import { FeaturedArticleCard } from "@/components/movie/FeaturedArticleCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { articles } from "@/data/editorial";
import { featuredHomepageHeroSeed } from "@/data/homepage";
import { formatRuntime } from "@/lib/utils";
import type { HomepageHeroItem } from "@/types/homepage";
import type { Credits, Movie, Video } from "@/types/tmdb";

export const dynamic = "force-dynamic";

function formatViewsLabel(voteCount: number) {
  return `${new Intl.NumberFormat("en-US").format(voteCount || 0)} Votes`;
}

function formatReleaseLabel(dateString: string) {
  if (!dateString) return "Coming Soon";

  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getHeroCandidates(collections: Movie[][]) {
  const seen = new Set<number>();
  const withBackdrop: Movie[] = [];
  const withoutBackdrop: Movie[] = [];

  collections.forEach((movies) => {
    movies.forEach((movie) => {
      if (seen.has(movie.id)) return;

      seen.add(movie.id);

      if (movie.backdrop_path) {
        withBackdrop.push(movie);
        return;
      }

      withoutBackdrop.push(movie);
    });
  });

  return [...withBackdrop, ...withoutBackdrop];
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

async function buildFeaturedHeroItem(featuredMovie: Movie | null) {
  const enhancements = await getMovieEnhancements(featuredMovie);
  const sourceMovieId = featuredMovie?.id;

  return {
    id: `featured-${sourceMovieId ?? "sankranthiki"}`,
    ...featuredHomepageHeroSeed,
    backdropPath:
      enhancements.details?.backdrop_path ?? featuredMovie?.backdrop_path ?? null,
    imageUrl: null,
    watchHref: sourceMovieId ? `/movie/${sourceMovieId}` : "/movies/trending",
    trailerHref: getTrailerHref(enhancements.videos, sourceMovieId),
    sourceMovieId,
  } satisfies HomepageHeroItem;
}

async function buildDynamicHeroItem(movie: Movie) {
  const enhancements = await getMovieEnhancements(movie);
  const details = enhancements.details;

  return {
    id: movie.id,
    title: movie.title,
    backdropPath: details?.backdrop_path ?? movie.backdrop_path,
    imageUrl: null,
    runtimeLabel: details?.runtime ? formatRuntime(details.runtime) : "Feature Film",
    viewsLabel: formatViewsLabel(movie.vote_count),
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
  } satisfies HomepageHeroItem;
}

async function buildHomepageHeroItems(data: {
  featuredMovie: Movie | null;
  trending: Movie[];
  popular: Movie[];
  nowPlaying: Movie[];
  upcoming: Movie[];
}) {
  const heroCandidates = getHeroCandidates([
    data.trending,
    data.popular,
    data.nowPlaying,
    data.upcoming,
  ]);

  const pinnedMovie = data.featuredMovie ?? heroCandidates[0] ?? null;
  const liveMovies = heroCandidates
    .filter((movie) => movie.id !== pinnedMovie?.id)
    .slice(0, 2);

  const [featuredHero, ...secondaryHeroes] = await Promise.all([
    buildFeaturedHeroItem(pinnedMovie),
    ...liveMovies.map((movie) => buildDynamicHeroItem(movie)),
  ]);

  return [featuredHero, ...secondaryHeroes];
}

async function getData() {
  try {
    const [
      trending,
      popular,
      upcoming,
      topRated,
      nowPlaying,
      featuredMatch,
      featuredFallbackMatch,
    ] = await Promise.all([
      getTrending("week"),
      getPopular(),
      getUpcoming(),
      getTopRated(),
      getNowPlaying(),
      searchMovies("Sankranthiki Vasthunnam"),
      searchMovies("Sankrantiki Vasthunnam"),
    ]);

    const featuredMovie =
      featuredMatch.results[0] ?? featuredFallbackMatch.results[0] ?? null;
    const heroItems = await buildHomepageHeroItems({
      featuredMovie,
      trending: trending.results,
      popular: popular.results,
      nowPlaying: nowPlaying.results,
      upcoming: upcoming.results,
    });

    return { heroItems, trending, popular, upcoming, topRated, nowPlaying };
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
          <p className="text-gray-400">
            Please check that the TMDB_API_KEY environment variable is set
            correctly.
          </p>
        </div>
      </div>
    );
  }

  const { heroItems, trending, popular, upcoming, topRated, nowPlaying } = data;

  return (
    <div className="overflow-x-clip bg-[#050505]">
      <HomeHeroBanner items={heroItems} />

      <section
        id="home-content"
        className="relative -mt-10 rounded-t-[34px] border-t border-white/10 bg-[radial-gradient(circle_at_top,rgba(108,52,19,0.34)_0%,rgba(18,10,8,0.9)_16%,#050505_42%)] px-4 pb-16 pt-16 md:px-8 xl:px-12"
      >
        <div className="mx-auto max-w-[1660px]">
          <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:gap-12">
            <div className="min-w-0 flex-1 space-y-12">
              <div className="rounded-[30px] border border-white/8 bg-black/18 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm md:p-8">
                <SectionHeader
                  title="Trending in Indian Cinema"
                  href="/movies/trending"
                />
                <MovieGrid
                  movies={trending.results.slice(0, 10)}
                  columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                />
              </div>

              <div className="rounded-[30px] border border-white/8 bg-black/18 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm md:p-8">
                <SectionHeader
                  title="South & Indian Cinema Stories"
                  href="/news"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {articles.slice(0, 3).map((article) => (
                    <FeaturedArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-white/8 bg-black/18 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm md:p-8">
                <SectionHeader
                  title="Now Playing in Theatres"
                  href="/movies/now-playing"
                />
                <MovieGrid
                  movies={nowPlaying.results.slice(0, 10)}
                  columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                />
              </div>

              <div className="rounded-[30px] border border-white/8 bg-black/18 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm md:p-8">
                <SectionHeader
                  title="Popular Across Languages"
                  href="/movies/popular"
                />
                <MovieGrid
                  movies={popular.results.slice(0, 10)}
                  columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                />
              </div>
            </div>

            <div className="w-full flex-shrink-0 space-y-6 xl:w-80">
              <MovieListWidget
                title="Upcoming Indian Releases"
                movies={upcoming.results}
                href="/movies/upcoming"
              />
              <MovieListWidget
                title="Top Rated Indian Picks"
                movies={topRated.results}
                href="/movies/top-rated"
              />
              <MovieListWidget
                title="Popular Telugu & Indian"
                movies={popular.results.slice(5)}
                href="/movies/popular"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

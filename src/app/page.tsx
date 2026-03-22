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
    const [teluguLatest, teluguUpcoming, teluguTMDB, hindi, tamil, upcoming, genreData] =
      await Promise.all([
        getLatestTeluguMovies(5),
        getUpcomingTeluguReleases(),
        getTeluguMovies(),
        getHindiMovies(),
        getTamilMovies(),
        getUpcoming(),
        getGenres(),
      ]);
    return {
      teluguLatest,
      teluguUpcoming,
      teluguTMDB,
      hindi,
      tamil,
      upcoming,
      genres: genreData.genres,
    };
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

  const { teluguLatest, teluguUpcoming, teluguTMDB, hindi, tamil, upcoming, genres } = data;

  // Use pipeline Telugu movies for the hero carousel, fallback to TMDB discover
  const heroMovies = teluguLatest.length > 0 ? teluguLatest : teluguTMDB.results;

  return (
    <div>
      <HeroCarousel movies={heroMovies} genres={genres} />

      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            {/* Telugu Movies — primary focus */}
            <SectionHeader title="Latest Telugu Releases" href="/movies/telugu" />
            <MovieGrid
              movies={teluguLatest.length > 0 ? teluguLatest.slice(0, 15) : teluguTMDB.results.slice(0, 15)}
              columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            />

            {/* Upcoming Telugu */}
            {teluguUpcoming.length > 0 && (
              <div className="mt-12">
                <SectionHeader title="Upcoming Telugu Movies" href="/movies/telugu" />
                <MovieGrid
                  movies={teluguUpcoming.slice(0, 10)}
                  columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                />
              </div>
            )}

            {/* Latest Stories */}
            <div className="mt-12">
              <SectionHeader title="Latest Stories" href="/news" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.slice(0, 3).map((article) => (
                  <FeaturedArticleCard key={article.id} article={article} />
                ))}
              </div>

            {/* Hindi / Bollywood */}
            <div className="mt-12">
              <SectionHeader title="Hindi / Bollywood" href="/movies/hindi" />
              <MovieGrid
                movies={hindi.results.slice(0, 10)}
                columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              />
            </div>

            {/* Tamil / Kollywood */}
            <div className="mt-12">
              <SectionHeader title="Tamil / Kollywood" href="/movies/tamil" />
              <MovieGrid
                movies={tamil.results.slice(0, 10)}
                columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              />
            </div>
          </div>

          {/* Right Sidebar — Telugu focused */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
            <MovieListWidget
              title="Upcoming Telugu"
              movies={teluguUpcoming.length > 0 ? teluguUpcoming : upcoming.results}
              href="/movies/telugu"
            />
            <MovieListWidget
              title="Telugu Releases"
              movies={teluguLatest.length > 0 ? teluguLatest.slice(10) : teluguTMDB.results.slice(10)}
              href="/movies/telugu"
            />
            <MovieListWidget
              title="Upcoming (All India)"
              movies={upcoming.results}
              href="/movies/upcoming"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

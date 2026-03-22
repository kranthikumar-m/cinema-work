import {
  getMovieCredits,
  getMovieDetails,
  getMovieImages,
  getMovieVideos,
} from "@/services/tmdb";
import { resolveHomepageHeroBackdrop } from "@/services/hero-backdrops";
import {
  getLatestTeluguReleases,
  getPopularTeluguMovies,
  getUpcomingTeluguMovies,
} from "@/services/telugu-movies";
import { HomeReferenceLanding } from "@/components/home/HomeReferenceLanding";
import { featuredHomepageHeroSeed } from "@/data/homepage";
import { formatRuntime } from "@/lib/utils";
import type { HomepageHeroItem } from "@/types/homepage";
import type {
  Credits,
  Movie,
  MovieDetails,
  MovieImage,
  Video,
} from "@/types/tmdb";

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

async function buildFallbackFeatureBundle() {
  return {
    heroItem: {
      id: "featured-fallback",
      ...featuredHomepageHeroSeed,
      backdropPath: null,
      imageUrl: "/placeholder-backdrop.svg",
      watchHref: "/movies/trending",
      trailerHref: "/videos",
      sourceMovieId: undefined,
    } satisfies HomepageHeroItem,
    movie: null,
    details: null,
    credits: null,
    images: null,
  };
}

async function getFeaturedMovieBundle(movie: Movie | null) {
  if (!movie) {
    return buildFallbackFeatureBundle();
  }

  const [detailsResult, creditsResult, videosResult, imagesResult] =
    await Promise.allSettled([
      getMovieDetails(movie.id),
      getMovieCredits(movie.id),
      getMovieVideos(movie.id),
      getMovieImages(movie.id),
    ]);

  const details = detailsResult.status === "fulfilled" ? detailsResult.value : null;
  const credits = creditsResult.status === "fulfilled" ? creditsResult.value : null;
  const videos = videosResult.status === "fulfilled" ? videosResult.value : null;
  const images =
    imagesResult.status === "fulfilled"
      ? (imagesResult.value as { backdrops: MovieImage[]; posters: MovieImage[] })
      : null;
  const heroBackdrop = await resolveHomepageHeroBackdrop(
    movie,
    details?.backdrop_path ?? movie.backdrop_path
  );

  return {
    heroItem: {
      id: movie.id,
      title: movie.title,
      backdropPath: heroBackdrop.backdropPath,
      imageUrl: heroBackdrop.imageUrl ?? movie.backdrop_url ?? null,
      runtimeLabel: details?.runtime ? formatRuntime(details.runtime) : "Telugu Feature",
      viewsLabel: "",
      director: getDirector(credits),
      actors: getActors(credits),
      releaseLabel: formatReleaseLabel(movie.release_date),
      watchHref: `/movie/${movie.id}`,
      trailerHref: getTrailerHref(videos, movie.id),
      trailerLabel: "TRAILER",
      accentLinks: {
        director: `/movie/${movie.id}`,
        cast: `/movie/${movie.id}`,
        release: `/movie/${movie.id}`,
      },
      sourceMovieId: movie.id,
    } satisfies HomepageHeroItem,
    movie,
    details: details as MovieDetails | null,
    credits,
    images,
  };
}

async function getData() {
  try {
    const [latestReleases, popular, upcoming] = await Promise.all([
      getLatestTeluguReleases(10),
      getPopularTeluguMovies(10),
      getUpcomingTeluguMovies(10),
    ]);

    const featuredMovie = dedupeMovies([latestReleases, popular, upcoming])[0] ?? null;
    const featured = await getFeaturedMovieBundle(featuredMovie);

    return { featured, upcoming };
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

  const { featured, upcoming } = data;

  return (
    <HomeReferenceLanding
      heroItem={featured.heroItem}
      featuredMovie={featured.movie}
      featuredDetails={featured.details}
      featuredCredits={featured.credits}
      featuredImages={featured.images}
      upcoming={upcoming}
    />
  );
}

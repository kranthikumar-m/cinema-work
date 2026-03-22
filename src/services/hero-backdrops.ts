import { getMovieImages } from "@/services/tmdb";
import { getHighQualityBackdropFallback } from "@/services/google-images";
import type { Movie, MovieImage } from "@/types/tmdb";

const HERO_MIN_BACKDROP_WIDTH = 1920;
const HERO_PREFERRED_BACKDROP_WIDTH = 3840;

interface HeroBackdropSelection {
  backdropPath: string | null;
  imageUrl: string | null;
}

function scoreBackdrop(image: MovieImage) {
  const preferredTier =
    image.width >= HERO_PREFERRED_BACKDROP_WIDTH
      ? 3
      : image.width >= HERO_MIN_BACKDROP_WIDTH
        ? 2
        : 1;
  const landscapeTier =
    image.aspect_ratio >= 1.6 && image.aspect_ratio <= 2.2 ? 1 : 0;

  return (
    preferredTier * 1_000_000_000 +
    landscapeTier * 100_000_000 +
    image.width * 10_000 +
    image.vote_count * 10 +
    image.vote_average
  );
}

function getBestTmdbBackdrop(backdrops: MovieImage[]) {
  if (!backdrops.length) {
    return null;
  }

  return [...backdrops].sort((a, b) => scoreBackdrop(b) - scoreBackdrop(a))[0];
}

export async function resolveHomepageHeroBackdrop(
  movie: Pick<Movie, "id" | "title" | "release_date" | "backdrop_path">,
  preferredBackdropPath?: string | null
): Promise<HeroBackdropSelection> {
  const images = await getMovieImages(movie.id).catch(() => null);
  const bestBackdrop = getBestTmdbBackdrop(images?.backdrops ?? []);
  const tmdbBackdropPath =
    bestBackdrop?.file_path ?? preferredBackdropPath ?? movie.backdrop_path ?? null;

  if (bestBackdrop && bestBackdrop.width >= HERO_MIN_BACKDROP_WIDTH) {
    return {
      backdropPath: bestBackdrop.file_path,
      imageUrl: null,
    };
  }

  if (!bestBackdrop && tmdbBackdropPath) {
    return {
      backdropPath: tmdbBackdropPath,
      imageUrl: null,
    };
  }

  const fallbackUrl = await getHighQualityBackdropFallback(movie);

  if (fallbackUrl) {
    return {
      backdropPath: tmdbBackdropPath,
      imageUrl: fallbackUrl,
    };
  }

  return {
    backdropPath: tmdbBackdropPath,
    imageUrl: null,
  };
}

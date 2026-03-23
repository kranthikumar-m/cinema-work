import { getBackdropUrl } from "@/lib/utils";
import { getOptionalDatabase, requireDatabase } from "@/lib/database";
import { getMovieDetails, getMovieImages } from "@/services/tmdb";
import { getHighQualityBackdropFallback } from "@/services/google-images";
import type { Movie, MovieImage } from "@/types/tmdb";
import type {
  MovieBackdropChoicesPayload,
  MovieBackdropOverrideRecord,
} from "@/types/admin";

const HERO_MIN_BACKDROP_WIDTH = 1920;
const HERO_PREFERRED_BACKDROP_WIDTH = 3840;

interface OverrideRow {
  movie_id: number;
  selected_backdrop_path: string;
  source: "tmdb";
  selected_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ResolvedBackdropSelection {
  backdropPath: string | null;
  imageUrl: string | null;
  source: "admin_override" | "tmdb_auto" | "movie_default" | "google_fallback";
  override: MovieBackdropOverrideRecord | null;
  overrideIsValid: boolean;
}

function mapOverride(row: OverrideRow | undefined): MovieBackdropOverrideRecord | null {
  if (!row) {
    return null;
  }

  return {
    movieId: row.movie_id,
    selectedBackdropPath: row.selected_backdrop_path,
    source: row.source,
    selectedByUserId: row.selected_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

export async function getMovieBackdropOverride(movieId: number) {
  const database = getOptionalDatabase();

  if (!database) {
    return null;
  }

  const row = database
    .prepare(
      `
        SELECT movie_id, selected_backdrop_path, source, selected_by_user_id, created_at, updated_at
        FROM movie_backdrop_overrides
        WHERE movie_id = ?
      `
    )
    .get<OverrideRow>(movieId);

  return mapOverride(row);
}

export async function setMovieBackdropOverride(
  movieId: number,
  selectedBackdropPath: string,
  userId: number
) {
  const database = requireDatabase();
  const timestamp = new Date().toISOString();

  database
    .prepare(
      `
        INSERT INTO movie_backdrop_overrides (
          movie_id,
          selected_backdrop_path,
          source,
          selected_by_user_id,
          created_at,
          updated_at
        )
        VALUES (?, ?, 'tmdb', ?, ?, ?)
        ON CONFLICT(movie_id) DO UPDATE SET
          selected_backdrop_path = excluded.selected_backdrop_path,
          source = excluded.source,
          selected_by_user_id = excluded.selected_by_user_id,
          updated_at = excluded.updated_at
      `
    )
    .run(movieId, selectedBackdropPath, userId, timestamp, timestamp);

  return getMovieBackdropOverride(movieId);
}

export async function clearMovieBackdropOverride(movieId: number) {
  const database = requireDatabase();
  database
    .prepare("DELETE FROM movie_backdrop_overrides WHERE movie_id = ?")
    .run(movieId);
}

export async function resolvePreferredBackdrop(
  movie: Pick<Movie, "id" | "title" | "release_date" | "backdrop_path" | "backdrop_url">,
  preferredBackdropPath?: string | null
): Promise<ResolvedBackdropSelection> {
  const [images, override] = await Promise.all([
    getMovieImages(movie.id).catch(() => null),
    getMovieBackdropOverride(movie.id),
  ]);
  const availableBackdrops = images?.backdrops ?? [];

  if (override) {
    const overrideStillExists =
      availableBackdrops.length === 0 ||
      availableBackdrops.some((image) => image.file_path === override.selectedBackdropPath);

    if (overrideStillExists) {
      return {
        backdropPath: override.selectedBackdropPath,
        imageUrl: null,
        source: "admin_override",
        override,
        overrideIsValid: true,
      };
    }
  }

  const bestBackdrop = getBestTmdbBackdrop(availableBackdrops);
  const tmdbBackdropPath =
    bestBackdrop?.file_path ??
    preferredBackdropPath ??
    movie.backdrop_path ??
    null;

  if (bestBackdrop && bestBackdrop.width >= HERO_MIN_BACKDROP_WIDTH) {
    return {
      backdropPath: bestBackdrop.file_path,
      imageUrl: null,
      source: "tmdb_auto",
      override,
      overrideIsValid: false,
    };
  }

  if (!bestBackdrop && tmdbBackdropPath) {
    return {
      backdropPath: tmdbBackdropPath,
      imageUrl: movie.backdrop_url ?? null,
      source: movie.backdrop_url ? "google_fallback" : "movie_default",
      override,
      overrideIsValid: !override,
    };
  }

  const fallbackUrl = await getHighQualityBackdropFallback(movie);

  if (fallbackUrl) {
    return {
      backdropPath: tmdbBackdropPath,
      imageUrl: fallbackUrl,
      source: "google_fallback",
      override,
      overrideIsValid: !override,
    };
  }

  return {
    backdropPath: tmdbBackdropPath,
    imageUrl: movie.backdrop_url ?? null,
    source: "movie_default",
    override,
    overrideIsValid: !override,
  };
}

export async function getMovieBackdropChoices(movieId: number): Promise<MovieBackdropChoicesPayload> {
  const movie = await getMovieDetails(movieId);
  const [images, currentSelection] = await Promise.all([
    getMovieImages(movieId),
    resolvePreferredBackdrop(movie, movie.backdrop_path),
  ]);

  const selectedPath =
    currentSelection.source === "google_fallback"
      ? null
      : currentSelection.backdropPath;

  return {
    movieId: movie.id,
    title: movie.title,
    currentSource: currentSelection.source,
    selectedBackdropPath: selectedPath,
    override: currentSelection.override,
    overrideIsValid: currentSelection.overrideIsValid,
    images: images.backdrops
      .slice()
      .sort((a, b) => scoreBackdrop(b) - scoreBackdrop(a))
      .map((image) => ({
        filePath: image.file_path,
        width: image.width,
        height: image.height,
        voteAverage: image.vote_average,
        voteCount: image.vote_count,
        previewUrl: getBackdropUrl(image.file_path, "w780"),
        isSelected: image.file_path === selectedPath,
      })),
  };
}

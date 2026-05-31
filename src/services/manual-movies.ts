import { getMovieDetails } from "@/services/tmdb";
import { enrichMovieAssets } from "@/services/telugu-movies";
import { hasDatabaseConfiguration, listManualMovieRecords } from "@/lib/database";
import type { Movie } from "@/types/tmdb";

/**
 * Loads every admin-curated movie as a fully enriched `Movie`, regardless of its
 * release date. Callers decide how to split the result (released vs. upcoming).
 */
export async function getManuallyAddedMovies(): Promise<Movie[]> {
  if (!hasDatabaseConfiguration()) return [];

  const rows = await listManualMovieRecords().catch(() => []);
  if (!rows.length) return [];

  const results = await Promise.allSettled(
    rows.map((row) =>
      getMovieDetails(row.movie_id).then((details) =>
        enrichMovieAssets(details as unknown as Movie)
      )
    )
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Movie> => r.status === "fulfilled")
    .map((r) => r.value);
}

/** Appends `additions` to `base`, skipping any movie id already present. */
export function mergeUnique(base: Movie[], additions: Movie[]): Movie[] {
  const ids = new Set(base.map((m) => m.id));
  const merged = [...base];
  for (const movie of additions) {
    if (!ids.has(movie.id)) {
      merged.push(movie);
      ids.add(movie.id);
    }
  }
  return merged;
}

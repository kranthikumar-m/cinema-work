/**
 * Telugu Data Service (unified entry point)
 *
 * Ties together the Telugu pipeline, Wikipedia cross-validator,
 * and fallback image service into a single cohesive data layer.
 *
 * Usage:
 *   - getValidatedTeluguReleases(year) → cross-validated Telugu movies for a year
 *   - getTeluguReleasesWithAssets(year) → validated + fallback images filled in
 *   - getLatestTeluguMovies() → recent Telugu movies (quick, no Wikipedia validation)
 *   - getTeluguStats() → summary of Telugu movie data for the current year
 *
 * Caching: leverages Next.js ISR via fetch revalidation in sub-services.
 */

import {
  fetchTeluguMoviesByYear,
  fetchTeluguMoviesFromTMDB,
  fetchUpcomingTeluguMovies,
  type TeluguMovie,
} from "./telugu-pipeline";
import { scrapeTeluguFilmsFromWikipedia } from "./wikipedia-scraper";
import { crossValidate, type ValidationResult } from "./cross-validator";
import { fillMissingAssetsForBatch } from "./fallback-images";

/**
 * Get the current year dynamically.
 */
function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Get Telugu movies for a year, cross-validated against Wikipedia.
 * Returns validated movies first, then TMDB-only movies.
 */
export async function getValidatedTeluguReleases(
  year?: number
): Promise<{
  movies: TeluguMovie[];
  validation: ValidationResult;
}> {
  const targetYear = year || getCurrentYear();

  try {
    const [tmdbMovies, wikiMovies] = await Promise.all([
      fetchTeluguMoviesByYear(targetYear),
      scrapeTeluguFilmsFromWikipedia(targetYear),
    ]);

    const validation = crossValidate(tmdbMovies, wikiMovies);

    // Validated movies first, then TMDB-only (still real movies, just not in Wikipedia yet)
    const allMovies = [...validation.validated, ...validation.tmdbOnly];

    // Log validation summary
    console.log(`[Telugu Data] Year ${targetYear} validation summary:`);
    console.log(`  TMDB movies: ${tmdbMovies.length}`);
    console.log(`  Wikipedia movies: ${wikiMovies.length}`);
    console.log(`  Validated (both sources): ${validation.validated.length}`);
    console.log(`  TMDB only: ${validation.tmdbOnly.length}`);
    console.log(`  Wiki only: ${validation.wikiOnly.length}`);

    return { movies: allMovies, validation };
  } catch (error) {
    console.error("[Telugu Data] Validation pipeline failed:", error);

    // Fallback: return TMDB-only data
    const tmdbMovies = await fetchTeluguMoviesByYear(targetYear).catch(
      () => []
    );
    return {
      movies: tmdbMovies,
      validation: {
        validated: [],
        tmdbOnly: tmdbMovies,
        wikiOnly: [],
        validationLog: ["Pipeline error - returning TMDB-only data"],
      },
    };
  }
}

/**
 * Get validated Telugu releases with fallback images filled in.
 */
export async function getTeluguReleasesWithAssets(
  year?: number
): Promise<TeluguMovie[]> {
  const { movies } = await getValidatedTeluguReleases(year);
  return fillMissingAssetsForBatch(movies);
}

/**
 * Quick fetch of latest Telugu movies (no Wikipedia validation).
 * Suitable for homepage and listing pages where speed matters.
 */
export async function getLatestTeluguMovies(
  maxPages = 3
): Promise<TeluguMovie[]> {
  return fetchTeluguMoviesFromTMDB(maxPages);
}

/**
 * Get upcoming Telugu movie releases.
 */
export async function getUpcomingTeluguReleases(): Promise<TeluguMovie[]> {
  return fetchUpcomingTeluguMovies();
}

/**
 * Get summary stats for Telugu movies this year.
 */
export async function getTeluguStats(): Promise<{
  totalReleased: number;
  validatedCount: number;
  upcomingCount: number;
  year: number;
}> {
  const year = getCurrentYear();

  try {
    const [{ validation }, upcoming] = await Promise.all([
      getValidatedTeluguReleases(year),
      fetchUpcomingTeluguMovies(1),
    ]);

    return {
      totalReleased: validation.validated.length + validation.tmdbOnly.length,
      validatedCount: validation.validated.length,
      upcomingCount: upcoming.length,
      year,
    };
  } catch {
    return {
      totalReleased: 0,
      validatedCount: 0,
      upcomingCount: 0,
      year,
    };
  }
}

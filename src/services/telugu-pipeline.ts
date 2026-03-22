/**
 * Telugu Movie Pipeline
 *
 * Fetches Telugu movies from TMDB with strict filtering.
 * Telugu identification logic:
 *   1. Primary: original_language === "te" (strongest TMDB signal)
 *   2. Secondary: spoken_languages includes "te"
 *   3. Discover endpoint with with_original_language=te
 *
 * Release date filtering: only movies released up to today.
 * Pagination: fetches multiple pages to build a comprehensive list.
 */

import { env } from "@/lib/env";
import type { Movie, PaginatedResponse } from "@/types/tmdb";

const BASE_URL = env.TMDB_BASE_URL;
const API_KEY = env.TMDB_API_KEY;

async function tmdbFetch<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`TMDB error: ${res.status} for ${endpoint}`);
  }
  return res.json();
}

export interface TeluguMovie extends Movie {
  /** Whether this movie was validated against Wikipedia */
  wikipedia_validated?: boolean;
  /** Fallback poster URL if TMDB poster is missing */
  fallback_poster_url?: string | null;
  /** Fallback backdrop URL if TMDB backdrop is missing */
  fallback_backdrop_url?: string | null;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Fetch Telugu movies released up to today from TMDB discover endpoint.
 * Uses with_original_language=te as the primary filter.
 * Sorts by release_date.desc to get most recent first.
 */
export async function fetchTeluguMoviesFromTMDB(
  maxPages = 5
): Promise<TeluguMovie[]> {
  const today = getToday();
  const allMovies: TeluguMovie[] = [];
  const seenIds = new Set<number>();

  for (let page = 1; page <= maxPages; page++) {
    try {
      const data = await tmdbFetch<PaginatedResponse<Movie>>(
        "/discover/movie",
        {
          with_original_language: "te",
          "release_date.lte": today,
          sort_by: "release_date.desc",
          page: String(page),
          region: "IN",
        }
      );

      for (const movie of data.results) {
        if (!seenIds.has(movie.id) && movie.original_language === "te") {
          seenIds.add(movie.id);
          allMovies.push(movie);
        }
      }

      if (page >= data.total_pages) break;
    } catch (error) {
      console.error(`[Telugu Pipeline] Failed to fetch page ${page}:`, error);
      break;
    }
  }

  return allMovies;
}

/**
 * Fetch Telugu movies released in a specific year from TMDB.
 * Used for cross-referencing with Wikipedia yearly release lists.
 */
export async function fetchTeluguMoviesByYear(
  year: number,
  maxPages = 10
): Promise<TeluguMovie[]> {
  const today = getToday();
  const allMovies: TeluguMovie[] = [];
  const seenIds = new Set<number>();

  for (let page = 1; page <= maxPages; page++) {
    try {
      const data = await tmdbFetch<PaginatedResponse<Movie>>(
        "/discover/movie",
        {
          with_original_language: "te",
          primary_release_year: String(year),
          "release_date.lte": today,
          sort_by: "release_date.desc",
          page: String(page),
        }
      );

      for (const movie of data.results) {
        if (!seenIds.has(movie.id) && movie.original_language === "te") {
          seenIds.add(movie.id);
          allMovies.push(movie);
        }
      }

      if (page >= data.total_pages) break;
    } catch (error) {
      console.error(
        `[Telugu Pipeline] Failed year=${year} page=${page}:`,
        error
      );
      break;
    }
  }

  return allMovies;
}

/**
 * Fetch upcoming Telugu movies (release date after today).
 */
export async function fetchUpcomingTeluguMovies(
  maxPages = 3
): Promise<TeluguMovie[]> {
  const today = getToday();
  const allMovies: TeluguMovie[] = [];
  const seenIds = new Set<number>();

  for (let page = 1; page <= maxPages; page++) {
    try {
      const data = await tmdbFetch<PaginatedResponse<Movie>>(
        "/discover/movie",
        {
          with_original_language: "te",
          "release_date.gte": today,
          sort_by: "release_date.asc",
          page: String(page),
          region: "IN",
        }
      );

      for (const movie of data.results) {
        if (!seenIds.has(movie.id) && movie.original_language === "te") {
          seenIds.add(movie.id);
          allMovies.push(movie);
        }
      }

      if (page >= data.total_pages) break;
    } catch (error) {
      console.error(`[Telugu Pipeline] Upcoming page ${page} failed:`, error);
      break;
    }
  }

  return allMovies;
}

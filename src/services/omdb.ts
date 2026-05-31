import { cache } from "react";
import { env } from "@/lib/env";
import { getIndianTodayIsoDate } from "@/lib/date";
import type { Movie } from "@/types/tmdb";

/**
 * IMDb ratings via the OMDb API (omdbapi.com). IMDb has no free official API, so
 * OMDb is the source of truth for the IMDb score/vote count shown across the UI.
 *
 * Lookups are cached for 24h (fetch revalidate) and deduped within a request
 * (React `cache`). Only RELEASED films are queried — unreleased titles have no
 * IMDb rating, so we skip the call and let the UI show "NR". Without an
 * OMDB_API_KEY everything resolves to "no rating" (NR) and no calls are made.
 */

const OMDB_BASE_URL = "https://www.omdbapi.com/";
const OMDB_CACHE_SECONDS = 86400; // 24h
const IMDB_LOOKUP_CONCURRENCY = 8;

export interface ImdbRating {
  rating: number | null;
  votes: number | null;
}

const NO_RATING: ImdbRating = { rating: null, votes: null };

function parseRating(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseVotes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function releaseYear(dateString: string | undefined): string | undefined {
  const year = dateString?.slice(0, 4);
  return year && /^\d{4}$/.test(year) ? year : undefined;
}

async function omdbFetch(params: Record<string, string>): Promise<ImdbRating> {
  const apiKey = env.OMDB_API_KEY;
  if (!apiKey) return NO_RATING;

  const url = new URL(OMDB_BASE_URL);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("type", "movie");
  url.searchParams.set("r", "json");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  try {
    const res = await fetch(url.toString(), { next: { revalidate: OMDB_CACHE_SECONDS } });
    if (!res.ok) return NO_RATING;

    const data = (await res.json()) as {
      Response?: string;
      imdbRating?: string;
      imdbVotes?: string;
    };
    if (data?.Response === "False") return NO_RATING;

    return { rating: parseRating(data?.imdbRating), votes: parseVotes(data?.imdbVotes) };
  } catch {
    return NO_RATING;
  }
}

/** IMDb rating by IMDb ID (most accurate — use when `imdb_id` is known). */
export const getImdbRatingByImdbId = cache(
  async (imdbId: string): Promise<ImdbRating> => {
    if (!imdbId) return NO_RATING;
    return omdbFetch({ i: imdbId });
  }
);

/** IMDb rating by title (+ release year to disambiguate). */
export const getImdbRatingByTitle = cache(
  async (title: string, year?: string): Promise<ImdbRating> => {
    if (!title) return NO_RATING;
    return omdbFetch(year ? { t: title, y: year } : { t: title });
  }
);

function isReleased(movie: Movie, today: string): boolean {
  return Boolean(movie.release_date && movie.release_date <= today);
}

async function resolveImdbRating(movie: Movie, today: string): Promise<ImdbRating> {
  // Unreleased films have no IMDb rating — skip the lookup (shows "NR").
  if (!isReleased(movie, today)) return NO_RATING;

  const imdbId = (movie as { imdb_id?: string | null }).imdb_id ?? null;
  if (imdbId) return getImdbRatingByImdbId(imdbId);
  return getImdbRatingByTitle(movie.title, releaseYear(movie.release_date));
}

/** Attaches the IMDb rating/votes to a single movie. */
export async function attachImdbRating<T extends Movie>(movie: T): Promise<T> {
  if (!env.OMDB_API_KEY) return movie;
  const { rating, votes } = await resolveImdbRating(movie, getIndianTodayIsoDate());
  return { ...movie, imdb_rating: rating, imdb_votes: votes } as T;
}

/**
 * Attaches IMDb ratings to a list of movies with bounded concurrency. Returns
 * the list unchanged when no API key is configured (all "NR").
 */
export async function attachImdbRatings<T extends Movie>(movies: T[]): Promise<T[]> {
  if (!env.OMDB_API_KEY || !movies.length) return movies;

  const today = getIndianTodayIsoDate();
  const out: T[] = new Array(movies.length);
  let cursor = 0;

  async function worker() {
    while (cursor < movies.length) {
      const index = cursor;
      cursor += 1;
      const movie = movies[index];
      const { rating, votes } = await resolveImdbRating(movie, today);
      out[index] = { ...movie, imdb_rating: rating, imdb_votes: votes } as T;
    }
  }

  const workerCount = Math.min(IMDB_LOOKUP_CONCURRENCY, movies.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return out;
}

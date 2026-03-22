import { env, requireEnvVar } from "@/lib/env";
import type {
  Movie,
  MovieDetails,
  Credits,
  Video,
  MovieImage,
  WatchProviderResult,
  Review,
  PaginatedResponse,
  Genre,
  Person,
} from "@/types/tmdb";

async function tmdbFetch<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${env.TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", requireEnvVar("TMDB_API_KEY"));
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText} for ${endpoint}`);
  }

  return res.json();
}

// Indian cinema focus: region=IN for all listing endpoints
const INDIA_REGION = "IN";

// Movies - focused on Indian cinema
export async function getTrending(
  timeWindow: "day" | "week" = "week",
  page = 1
): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch(`/trending/movie/${timeWindow}`, {
    page: String(page),
    region: INDIA_REGION,
  });
}

export async function getPopular(page = 1): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch("/movie/popular", {
    page: String(page),
    region: INDIA_REGION,
  });
}

export async function getTopRated(page = 1): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch("/movie/top_rated", {
    page: String(page),
    region: INDIA_REGION,
  });
}

export async function getUpcoming(page = 1): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch("/movie/upcoming", {
    page: String(page),
    region: INDIA_REGION,
  });
}

export async function getNowPlaying(page = 1): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch("/movie/now_playing", {
    page: String(page),
    region: INDIA_REGION,
  });
}

// Discover by Indian language
export async function getTeluguMovies(page = 1): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch("/discover/movie", {
    with_original_language: "te",
    sort_by: "popularity.desc",
    page: String(page),
  });
}

export async function getHindiMovies(page = 1): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch("/discover/movie", {
    with_original_language: "hi",
    sort_by: "popularity.desc",
    page: String(page),
  });
}

export async function getTamilMovies(page = 1): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch("/discover/movie", {
    with_original_language: "ta",
    sort_by: "popularity.desc",
    page: String(page),
  });
}

export async function getKannadaMovies(page = 1): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch("/discover/movie", {
    with_original_language: "kn",
    sort_by: "popularity.desc",
    page: String(page),
  });
}

export async function getMalayalamMovies(page = 1): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch("/discover/movie", {
    with_original_language: "ml",
    sort_by: "popularity.desc",
    page: String(page),
  });
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  return tmdbFetch(`/movie/${id}`);
}

export async function getMovieCredits(id: number): Promise<Credits> {
  return tmdbFetch(`/movie/${id}/credits`);
}

export async function getMovieVideos(id: number): Promise<{ results: Video[] }> {
  return tmdbFetch(`/movie/${id}/videos`);
}

export async function getMovieImages(
  id: number
): Promise<{ backdrops: MovieImage[]; posters: MovieImage[] }> {
  return tmdbFetch(`/movie/${id}/images`);
}

export async function getMovieReviews(
  id: number,
  page = 1
): Promise<PaginatedResponse<Review>> {
  return tmdbFetch(`/movie/${id}/reviews`, { page: String(page) });
}

export async function getSimilarMovies(
  id: number,
  page = 1
): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch(`/movie/${id}/similar`, { page: String(page) });
}

export async function getRecommendedMovies(
  id: number,
  page = 1
): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch(`/movie/${id}/recommendations`, { page: String(page) });
}

export async function getWatchProviders(
  id: number
): Promise<{ results: Record<string, WatchProviderResult> }> {
  return tmdbFetch(`/movie/${id}/watch/providers`);
}

// Search
export async function searchMovies(
  query: string,
  page = 1
): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch("/search/movie", { query, page: String(page) });
}

// Genres
export async function getGenres(): Promise<{ genres: Genre[] }> {
  return tmdbFetch("/genre/movie/list");
}

// Discover
export async function discoverMovies(
  params: Record<string, string> = {},
  page = 1
): Promise<PaginatedResponse<Movie>> {
  return tmdbFetch("/discover/movie", { ...params, page: String(page) });
}

// People
export async function getTrendingPeople(
  page = 1
): Promise<PaginatedResponse<Person>> {
  return tmdbFetch("/trending/person/week", { page: String(page) });
}

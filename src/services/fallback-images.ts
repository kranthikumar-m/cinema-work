/**
 * Fallback Image Retrieval
 *
 * For Telugu movies missing poster or backdrop from TMDB,
 * attempts to find suitable images via Google Custom Search API.
 *
 * Architecture:
 *   - Only triggers when TMDB poster_path or backdrop_path is null
 *   - Uses Google Custom Search JSON API (requires GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID)
 *   - Falls back gracefully to placeholder SVGs if no API key or search fails
 *   - Stores fallback URLs in the movie object (fallback_poster_url, fallback_backdrop_url)
 *   - Never overwrites valid TMDB assets
 *
 * Required env vars (optional - feature degrades gracefully):
 *   GOOGLE_CSE_API_KEY - Google Custom Search API key
 *   GOOGLE_CSE_ID - Custom Search Engine ID (configured for image search)
 */

import type { TeluguMovie } from "./telugu-pipeline";

const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY || "";
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID || "";

interface GoogleSearchResult {
  items?: Array<{
    link: string;
    image?: {
      height: number;
      width: number;
    };
  }>;
}

/**
 * Search Google Images for a movie poster or backdrop.
 * Returns the URL of the best matching image, or null.
 */
async function searchGoogleImages(
  query: string,
  type: "poster" | "backdrop"
): Promise<string | null> {
  if (!GOOGLE_CSE_API_KEY || !GOOGLE_CSE_ID) {
    return null; // No API credentials configured
  }

  try {
    const searchQuery =
      type === "poster"
        ? `${query} Telugu movie poster`
        : `${query} Telugu movie backdrop wallpaper`;

    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", GOOGLE_CSE_API_KEY);
    url.searchParams.set("cx", GOOGLE_CSE_ID);
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("searchType", "image");
    url.searchParams.set("num", "5");
    url.searchParams.set("safe", "active");

    // Prefer portrait for posters, landscape for backdrops
    if (type === "poster") {
      url.searchParams.set("imgSize", "large");
      url.searchParams.set("imgType", "photo");
    } else {
      url.searchParams.set("imgSize", "xlarge");
      url.searchParams.set("imgType", "photo");
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(`[Fallback Images] Google search failed: ${res.status}`);
      return null;
    }

    const data: GoogleSearchResult = await res.json();
    if (!data.items || data.items.length === 0) return null;

    // For posters, prefer portrait-oriented images
    // For backdrops, prefer landscape-oriented images
    const preferred = data.items.find((item) => {
      if (!item.image) return false;
      const ratio = item.image.width / item.image.height;
      return type === "poster" ? ratio < 1 : ratio > 1.3;
    });

    return preferred?.link || data.items[0]?.link || null;
  } catch (error) {
    console.error("[Fallback Images] Search error:", error);
    return null;
  }
}

/**
 * Check a single movie for missing assets and attempt to fill them.
 * Only fetches fallbacks when TMDB assets are null.
 */
export async function fillMissingAssets(
  movie: TeluguMovie
): Promise<TeluguMovie> {
  const updated = { ...movie };

  if (!movie.poster_path && !movie.fallback_poster_url) {
    const posterUrl = await searchGoogleImages(movie.title, "poster");
    if (posterUrl) {
      updated.fallback_poster_url = posterUrl;
    }
  }

  if (!movie.backdrop_path && !movie.fallback_backdrop_url) {
    const backdropUrl = await searchGoogleImages(movie.title, "backdrop");
    if (backdropUrl) {
      updated.fallback_backdrop_url = backdropUrl;
    }
  }

  return updated;
}

/**
 * Process a batch of movies, filling in missing assets.
 * Rate-limited: processes sequentially to respect Google API limits.
 */
export async function fillMissingAssetsForBatch(
  movies: TeluguMovie[]
): Promise<TeluguMovie[]> {
  const needsFallback = movies.filter(
    (m) => !m.poster_path || !m.backdrop_path
  );

  if (needsFallback.length === 0) return movies;

  if (!GOOGLE_CSE_API_KEY || !GOOGLE_CSE_ID) {
    console.log(
      `[Fallback Images] ${needsFallback.length} movies need assets but GOOGLE_CSE_API_KEY/GOOGLE_CSE_ID not configured. Using placeholders.`
    );
    return movies;
  }

  console.log(
    `[Fallback Images] Fetching fallback images for ${needsFallback.length} movies...`
  );

  const updatedMap = new Map<number, TeluguMovie>();

  for (const movie of needsFallback) {
    try {
      const updated = await fillMissingAssets(movie);
      updatedMap.set(movie.id, updated);
    } catch (error) {
      console.error(
        `[Fallback Images] Failed for "${movie.title}":`,
        error
      );
    }
    // Rate limit: 100ms between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return movies.map((m) => updatedMap.get(m.id) || m);
}

/**
 * Get the best available poster URL for a movie.
 * Prioritizes: TMDB > fallback > placeholder
 */
export function getMoviePosterUrl(movie: TeluguMovie): string {
  if (movie.poster_path) {
    return `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  }
  if (movie.fallback_poster_url) {
    return movie.fallback_poster_url;
  }
  return "/placeholder-movie.svg";
}

/**
 * Get the best available backdrop URL for a movie.
 * Prioritizes: TMDB > fallback > placeholder
 */
export function getMovieBackdropUrl(movie: TeluguMovie): string {
  if (movie.backdrop_path) {
    return `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
  }
  if (movie.fallback_backdrop_url) {
    return movie.fallback_backdrop_url;
  }
  return "/placeholder-backdrop.svg";
}

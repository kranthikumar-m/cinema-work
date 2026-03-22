import { env } from "@/lib/env";
import type { Movie } from "@/types/tmdb";

const GOOGLE_IMAGES_BASE_URL = "https://www.google.com/search";
const ABSOLUTE_IMAGE_URL_REGEX =
  /https:\/\/[^"'\\\s<>]+?\.(?:avif|jpe?g|png|webp)(?:\?[^"'\\\s<>]*)?/gi;
const BLOCKED_IMAGE_HOSTS = ["google.com", "gstatic.com", "googleusercontent.com"];
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

interface GoogleImageMatch {
  originalUrl: string;
  proxiedUrl: string;
}

interface MovieFallbackAssets {
  posterUrl: string | null;
  backdropUrl: string | null;
}

const fallbackAssetCache = new Map<string, Promise<MovieFallbackAssets>>();

function buildImageProxyUrl(url: string) {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function buildSearchUrl(query: string) {
  const url = new URL(GOOGLE_IMAGES_BASE_URL);
  url.searchParams.set("tbm", "isch");
  url.searchParams.set("hl", "en");
  url.searchParams.set("q", query);
  return url.toString();
}

async function lookupGoogleImageAcrossQueries(queries: string[]) {
  for (let index = 0; index < queries.length; index += 1) {
    const match = await lookupGoogleImage(queries[index]);

    if (match) {
      return match;
    }
  }

  return null;
}

function isUsableImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return !BLOCKED_IMAGE_HOSTS.some((host) => parsed.hostname.includes(host));
  } catch {
    return false;
  }
}

function extractGoogleImageMatch(html: string): GoogleImageMatch | null {
  const matches = html.match(ABSOLUTE_IMAGE_URL_REGEX) ?? [];
  const candidate = matches.find((match) => isUsableImageUrl(match));

  if (!candidate) {
    return null;
  }

  return {
    originalUrl: candidate,
    proxiedUrl: buildImageProxyUrl(candidate),
  };
}

async function lookupGoogleImage(query: string) {
  const response = await fetch(buildSearchUrl(query), {
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent": env.GOOGLE_IMAGES_USER_AGENT || DEFAULT_USER_AGENT,
    },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();

  if (/enablejs|SG_REL|httpservice\/retry/i.test(html)) {
    return null;
  }

  return extractGoogleImageMatch(html);
}

function buildFallbackQuery(movie: Pick<Movie, "title" | "release_date">, type: "poster" | "backdrop") {
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "";
  const suffix = type === "poster" ? "Telugu movie poster" : "Telugu movie background";
  return [movie.title, year, suffix].filter(Boolean).join(" ");
}

function buildHighQualityBackdropQueries(
  movie: Pick<Movie, "title" | "release_date">
) {
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "";
  const baseParts = [movie.title, year].filter(Boolean).join(" ");

  return [
    `${baseParts} Telugu movie backdrop 4k`,
    `${baseParts} Telugu movie background 4k`,
    `${baseParts} Telugu movie backdrop 1080p`,
    `${baseParts} Telugu movie background hd`,
  ];
}

async function resolveMovieFallbackAssets(
  movie: Pick<Movie, "id" | "title" | "release_date" | "poster_path" | "backdrop_path">
): Promise<MovieFallbackAssets> {
  const posterUrl = movie.poster_path
    ? null
    : (await lookupGoogleImage(buildFallbackQuery(movie, "poster")))?.proxiedUrl ?? null;

  const backdropUrl = movie.backdrop_path
    ? null
    : (await lookupGoogleImage(buildFallbackQuery(movie, "backdrop")))?.proxiedUrl ?? null;

  return { posterUrl, backdropUrl };
}

export async function getMovieFallbackAssets(
  movie: Pick<Movie, "id" | "title" | "release_date" | "poster_path" | "backdrop_path">
) {
  const cacheKey = [
    movie.id,
    movie.title,
    movie.release_date,
    movie.poster_path ?? "missing-poster",
    movie.backdrop_path ?? "missing-backdrop",
  ].join(":");

  if (!fallbackAssetCache.has(cacheKey)) {
    fallbackAssetCache.set(cacheKey, resolveMovieFallbackAssets(movie));
  }

  return fallbackAssetCache.get(cacheKey)!;
}

export async function getHighQualityBackdropFallback(
  movie: Pick<Movie, "title" | "release_date">
) {
  const match = await lookupGoogleImageAcrossQueries(
    buildHighQualityBackdropQueries(movie)
  );

  return match?.proxiedUrl ?? null;
}

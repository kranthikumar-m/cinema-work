import "server-only";
import { env } from "@/lib/env";
import { getTitleSimilarityScore } from "@/lib/title-matching";

/**
 * Spotify Web API (client-credentials flow) for a movie's soundtrack: album +
 * track list (titles, singers, durations, art, label). No lyrics — Spotify
 * doesn't expose them; lyrics come from the Genius service. Token is cached in
 * memory for its lifetime; album lookups are invoked behind a cached
 * orchestrator, so this module isn't hit on every request.
 */

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API = "https://api.spotify.com/v1";
const MARKET = "IN";
const ALBUM_MATCH_MIN_SCORE = 0.6;

export interface SpotifyTrack {
  spotifyId: string;
  trackNumber: number;
  title: string;
  artists: string[];
  durationMs: number;
}

export interface SpotifyAlbum {
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  releaseDate: string;
  label: string | null;
  primaryArtist: string | null;
  tracks: SpotifyTrack[];
}

interface SpotifyImage {
  url: string;
  width?: number | null;
}

interface SpotifyArtistRef {
  name: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  const id = env.SPOTIFY_CLIENT_ID;
  const secret = env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.value;
  }

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  try {
    const res = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;

    cachedToken = {
      value: data.access_token,
      expiresAt: now + (data.expires_in ?? 3600) * 1000,
    };
    return cachedToken.value;
  } catch {
    return null;
  }
}

async function spotifyGet<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${SPOTIFY_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function pickImage(images: SpotifyImage[] | undefined): string | null {
  if (!images?.length) return null;
  const sorted = [...images].sort(
    (a, b) => Math.abs((a.width ?? 0) - 300) - Math.abs((b.width ?? 0) - 300)
  );
  return sorted[0]?.url ?? images[0].url ?? null;
}

/**
 * Finds the Spotify album that best matches a movie's soundtrack by name
 * (release year as a tie-breaker), then returns it with its full track list.
 */
export async function findMovieAlbum(
  movieTitle: string,
  year?: number | null
): Promise<SpotifyAlbum | null> {
  const token = await getToken();
  if (!token || !movieTitle) return null;

  const search = await spotifyGet<{
    albums?: {
      items?: Array<{
        id: string;
        name: string;
        release_date?: string;
        images?: SpotifyImage[];
      }>;
    };
  }>(`/search?q=${encodeURIComponent(movieTitle)}&type=album&market=${MARKET}&limit=10`, token);

  const items = search?.albums?.items ?? [];
  if (!items.length) return null;

  let bestId: string | null = null;
  let bestScore = 0;
  for (const item of items) {
    let score = getTitleSimilarityScore(movieTitle, item.name);
    const itemYear = Number.parseInt((item.release_date ?? "").slice(0, 4), 10);
    if (year && Number.isFinite(itemYear) && Math.abs(itemYear - year) <= 1) {
      score += 0.15;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = item.id;
    }
  }
  if (!bestId || bestScore < ALBUM_MATCH_MIN_SCORE) return null;

  const album = await spotifyGet<{
    id: string;
    name: string;
    release_date?: string;
    label?: string;
    images?: SpotifyImage[];
    artists?: SpotifyArtistRef[];
    tracks?: {
      items?: Array<{
        id: string;
        name: string;
        track_number: number;
        duration_ms: number;
        artists?: SpotifyArtistRef[];
      }>;
    };
  }>(`/albums/${bestId}?market=${MARKET}`, token);
  if (!album) return null;

  const tracks: SpotifyTrack[] = (album.tracks?.items ?? []).map((t) => ({
    spotifyId: t.id,
    trackNumber: t.track_number,
    title: t.name,
    artists: (t.artists ?? []).map((a) => a.name),
    durationMs: t.duration_ms,
  }));

  return {
    spotifyId: album.id,
    name: album.name,
    imageUrl: pickImage(album.images),
    releaseDate: album.release_date ?? "",
    label: album.label ?? null,
    primaryArtist: album.artists?.[0]?.name ?? null,
    tracks,
  };
}

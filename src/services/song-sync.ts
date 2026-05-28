import "server-only";
import { env } from "@/lib/env";
import {
  hasDatabaseConfiguration,
  listManualMovieRecords,
  insertMovieVideoRecord,
  getSongSyncRecord,
  upsertSongSyncRecord,
  listMovieVideoRecords,
} from "@/lib/database";
import { getLatestTeluguReleases } from "@/services/telugu-movies";
import { getMovieDetails } from "@/services/tmdb";

const SYNC_WINDOW_DAYS = 50;
const MIN_SYNC_INTERVAL_HOURS = 20;
const MAX_SONGS_PER_MOVIE = 15;

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    thumbnails: { medium?: { url: string }; default?: { url: string } };
    channelTitle: string;
  };
}

async function searchYouTubeSongs(
  query: string,
  maxResults = MAX_SONGS_PER_MOVIE
): Promise<{ videoId: string; title: string }[]> {
  if (!env.YOUTUBE_API_KEY) return [];

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  return (data.items ?? []).map((item: YouTubeSearchItem) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
  }));
}

function isWithinSyncWindow(releaseDate: string | null | undefined): boolean {
  if (!releaseDate) return false;
  const release = new Date(releaseDate);
  const now = new Date();
  const diffMs = now.getTime() - release.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= -7 && diffDays <= SYNC_WINDOW_DAYS;
}

function shouldSync(lastSyncedAt: string | null): boolean {
  if (!lastSyncedAt) return true;
  const last = new Date(lastSyncedAt);
  const now = new Date();
  const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
  return diffHours >= MIN_SYNC_INTERVAL_HOURS;
}

async function syncSongsForMovie(movie: { id: number; title: string; releaseDate: string | null }): Promise<number> {
  const syncRecord = await getSongSyncRecord(movie.id);
  if (!shouldSync(syncRecord?.last_synced_at ?? null)) return 0;

  const existingVideos = await listMovieVideoRecords(movie.id);
  const existingKeys = new Set(existingVideos.map((v) => v.youtube_key));

  const query = `${movie.title} Telugu album songs`;
  const results = await searchYouTubeSongs(query);

  let added = 0;
  const now = new Date().toISOString();

  for (const result of results) {
    if (existingKeys.has(result.videoId)) continue;

    await insertMovieVideoRecord({
      movieId: movie.id,
      youtubeKey: result.videoId,
      title: result.title,
      category: "song",
      addedByUserId: null,
      createdAt: now,
    });
    added++;
  }

  await upsertSongSyncRecord(movie.id, now);
  return added;
}

export async function runSongSync(): Promise<{
  processed: number;
  songsAdded: number;
  skipped: number;
  errors: string[];
}> {
  if (!hasDatabaseConfiguration()) {
    return { processed: 0, songsAdded: 0, skipped: 0, errors: ["No database configured."] };
  }

  if (!env.YOUTUBE_API_KEY) {
    return { processed: 0, songsAdded: 0, skipped: 0, errors: ["YOUTUBE_API_KEY not set."] };
  }

  const errors: string[] = [];
  let processed = 0;
  let songsAdded = 0;
  let skipped = 0;

  const eligibleMovies: { id: number; title: string; releaseDate: string | null }[] = [];

  try {
    const apiMovies = await getLatestTeluguReleases(100);
    for (const m of apiMovies) {
      if (isWithinSyncWindow(m.release_date)) {
        eligibleMovies.push({ id: m.id, title: m.title, releaseDate: m.release_date });
      }
    }
  } catch (err) {
    errors.push(`Failed to fetch API movies: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const manualRows = await listManualMovieRecords();
    for (const row of manualRows) {
      if (eligibleMovies.some((m) => m.id === row.movie_id)) continue;
      if (!isWithinSyncWindow(row.release_date)) continue;

      try {
        const details = await getMovieDetails(row.movie_id);
        eligibleMovies.push({
          id: details.id,
          title: details.title,
          releaseDate: details.release_date || row.release_date,
        });
      } catch {
        eligibleMovies.push({
          id: row.movie_id,
          title: row.tmdb_title,
          releaseDate: row.release_date,
        });
      }
    }
  } catch (err) {
    errors.push(`Failed to fetch manual movies: ${err instanceof Error ? err.message : String(err)}`);
  }

  for (const movie of eligibleMovies) {
    try {
      const added = await syncSongsForMovie(movie);
      if (added > 0) {
        processed++;
        songsAdded += added;
      } else {
        skipped++;
      }
    } catch (err) {
      errors.push(`Error syncing "${movie.title}" (${movie.id}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { processed, songsAdded, skipped, errors };
}

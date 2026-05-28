import "server-only";
import { env } from "@/lib/env";
import {
  hasDatabaseConfiguration,
  listManualMovieRecords,
  insertMovieVideoRecord,
  deleteMovieVideoRecord,
  getSongSyncRecord,
  upsertSongSyncRecord,
  listMovieVideoRecords,
} from "@/lib/database";
import { getLatestTeluguReleases } from "@/services/telugu-movies";
import { getMovieDetails } from "@/services/tmdb";

const SYNC_WINDOW_DAYS = 50;
const MIN_SYNC_INTERVAL_HOURS = 20;
const MAX_SEARCH_RESULTS = 25;
const MAX_SONGS_PER_MOVIE = 10;
const MAX_DURATION_SECONDS = 8 * 60;
const MIN_DURATION_SECONDS = 60;

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
  };
}

interface YouTubeVideoDetail {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
  };
  contentDetails: {
    duration: string;
  };
}

function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  return h * 3600 + m * 60 + s;
}

const JUNK_PATTERNS = [
  /jukebox/i,
  /video\s*jukebox/i,
  /hits\s*(collection|compilation)/i,
  /top\s*\d+\s*(hits|songs)/i,
  /latest\s*(tollywood|telugu|bollywood)\s*(hits|songs)/i,
  /best\s*of\s*\d{4}/i,
  /trending\s*(songs|hits)/i,
  /nonstop/i,
  /non[\s-]?stop/i,
  /mashup/i,
  /back\s*to\s*back/i,
  /b2b/i,
  /full\s*video\s*songs?\s*jukebox/i,
  /mega\s*(hit|mix)/i,
  /dance\s*&?\s*(romance|hits)/i,
  /love\s*hits/i,
  /emotion\s*&?\s*(energy|hits)/i,
  /party\s*songs/i,
  /workout\s*songs/i,
  /sad\s*songs/i,
];

function isJunkTitle(title: string): boolean {
  return JUNK_PATTERNS.some((p) => p.test(title));
}

function titleMatchesMovie(videoTitle: string, movieTitle: string): boolean {
  const normalizedVideo = videoTitle.toLowerCase().replace(/[^\w\s]/g, "");
  const normalizedMovie = movieTitle.toLowerCase().replace(/[^\w\s]/g, "");

  const movieWords = normalizedMovie.split(/\s+/).filter((w) => w.length > 1);
  if (!movieWords.length) return false;

  if (normalizedVideo.includes(normalizedMovie)) return true;

  const matchCount = movieWords.filter((w) => normalizedVideo.includes(w)).length;
  return matchCount >= Math.ceil(movieWords.length * 0.6);
}

async function searchYouTube(query: string): Promise<YouTubeSearchItem[]> {
  if (!env.YOUTUBE_API_KEY) return [];

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10");
  url.searchParams.set("maxResults", String(MAX_SEARCH_RESULTS));
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  return data.items ?? [];
}

async function getVideoDetails(videoIds: string[]): Promise<YouTubeVideoDetail[]> {
  if (!env.YOUTUBE_API_KEY || !videoIds.length) return [];

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  return data.items ?? [];
}

function filterAndRankSongs(
  details: YouTubeVideoDetail[],
  movieTitle: string
): { videoId: string; title: string }[] {
  const candidates: { videoId: string; title: string; score: number }[] = [];

  for (const video of details) {
    const title = video.snippet.title;
    const duration = parseIsoDuration(video.contentDetails.duration);

    if (duration < MIN_DURATION_SECONDS || duration > MAX_DURATION_SECONDS) continue;

    if (isJunkTitle(title)) continue;

    if (!titleMatchesMovie(title, movieTitle)) continue;

    let score = 0;

    const titleLower = title.toLowerCase();
    if (titleLower.includes("full video")) score += 3;
    if (titleLower.includes("lyric")) score += 2;
    if (titleLower.includes("video song")) score += 2;
    if (titleLower.includes("official")) score += 1;
    if (titleLower.includes("from")) score += 1;

    if (duration >= 120 && duration <= 360) score += 2;

    const channelLower = video.snippet.channelTitle.toLowerCase();
    if (
      channelLower.includes("saregama") ||
      channelLower.includes("aditya music") ||
      channelLower.includes("sony music") ||
      channelLower.includes("lahari") ||
      channelLower.includes("mango music") ||
      channelLower.includes("anand audio") ||
      channelLower.includes("t-series")
    ) {
      score += 5;
    }

    candidates.push({ videoId: video.id, title, score });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, MAX_SONGS_PER_MOVIE).map((c) => ({
    videoId: c.videoId,
    title: c.title,
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

async function removeIrrelevantSongs(
  movieId: number,
  movieTitle: string
): Promise<number> {
  const existingVideos = await listMovieVideoRecords(movieId);
  const autoSyncedSongs = existingVideos.filter(
    (v) => v.category === "song" && v.added_by_user_id === null
  );

  if (!autoSyncedSongs.length) return 0;

  const videoIds = autoSyncedSongs.map((v) => v.youtube_key);
  const details = await getVideoDetails(videoIds);
  const detailMap = new Map(details.map((d) => [d.id, d]));

  let removed = 0;
  for (const song of autoSyncedSongs) {
    const detail = detailMap.get(song.youtube_key);

    let shouldRemove = false;

    if (!detail) {
      shouldRemove = isJunkTitle(song.title) || !titleMatchesMovie(song.title, movieTitle);
    } else {
      const duration = parseIsoDuration(detail.contentDetails.duration);
      if (duration < MIN_DURATION_SECONDS || duration > MAX_DURATION_SECONDS) {
        shouldRemove = true;
      } else if (isJunkTitle(detail.snippet.title)) {
        shouldRemove = true;
      } else if (!titleMatchesMovie(detail.snippet.title, movieTitle)) {
        shouldRemove = true;
      }
    }

    if (shouldRemove) {
      await deleteMovieVideoRecord(song.id);
      removed++;
    }
  }

  return removed;
}

async function syncSongsForMovie(
  movie: { id: number; title: string; releaseDate: string | null }
): Promise<{ added: number; removed: number }> {
  const syncRecord = await getSongSyncRecord(movie.id);
  if (!shouldSync(syncRecord?.last_synced_at ?? null)) return { added: 0, removed: 0 };

  const removed = await removeIrrelevantSongs(movie.id, movie.title);

  const existingVideos = await listMovieVideoRecords(movie.id);
  const existingKeys = new Set(existingVideos.map((v) => v.youtube_key));

  const searchItems = await searchYouTube(`"${movie.title}" Telugu movie songs`);
  if (!searchItems.length) {
    await upsertSongSyncRecord(movie.id, new Date().toISOString());
    return { added: 0, removed };
  }

  const videoIds = searchItems
    .map((item) => item.id.videoId)
    .filter((id) => !existingKeys.has(id));

  if (!videoIds.length) {
    await upsertSongSyncRecord(movie.id, new Date().toISOString());
    return { added: 0, removed };
  }

  const details = await getVideoDetails(videoIds);
  const filtered = filterAndRankSongs(details, movie.title);

  let added = 0;
  const now = new Date().toISOString();

  for (const result of filtered) {
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
  return { added, removed };
}

export async function ensureMovieSongsSync(
  movieId: number,
  movieTitle: string
): Promise<void> {
  if (!hasDatabaseConfiguration() || !env.YOUTUBE_API_KEY) return;

  const syncRecord = await getSongSyncRecord(movieId);
  if (!shouldSync(syncRecord?.last_synced_at ?? null)) return;

  await removeIrrelevantSongs(movieId, movieTitle);

  const existingVideos = await listMovieVideoRecords(movieId);
  const existingKeys = new Set(existingVideos.map((v) => v.youtube_key));

  const searchItems = await searchYouTube(`"${movieTitle}" Telugu movie songs`);
  if (!searchItems.length) {
    await upsertSongSyncRecord(movieId, new Date().toISOString());
    return;
  }

  const videoIds = searchItems
    .map((item) => item.id.videoId)
    .filter((id) => !existingKeys.has(id));

  if (!videoIds.length) {
    await upsertSongSyncRecord(movieId, new Date().toISOString());
    return;
  }

  const details = await getVideoDetails(videoIds);
  const filtered = filterAndRankSongs(details, movieTitle);

  const now = new Date().toISOString();
  for (const result of filtered) {
    if (existingKeys.has(result.videoId)) continue;
    await insertMovieVideoRecord({
      movieId,
      youtubeKey: result.videoId,
      title: result.title,
      category: "song",
      addedByUserId: null,
      createdAt: now,
    });
  }

  await upsertSongSyncRecord(movieId, now);
}

export async function runSongSync(): Promise<{
  processed: number;
  songsAdded: number;
  songsRemoved: number;
  skipped: number;
  errors: string[];
}> {
  if (!hasDatabaseConfiguration()) {
    return { processed: 0, songsAdded: 0, songsRemoved: 0, skipped: 0, errors: ["No database configured."] };
  }

  if (!env.YOUTUBE_API_KEY) {
    return { processed: 0, songsAdded: 0, songsRemoved: 0, skipped: 0, errors: ["YOUTUBE_API_KEY not set."] };
  }

  const errors: string[] = [];
  let processed = 0;
  let songsAdded = 0;
  let songsRemoved = 0;
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
      const result = await syncSongsForMovie(movie);
      songsRemoved += result.removed;
      if (result.added > 0 || result.removed > 0) {
        processed++;
        songsAdded += result.added;
      } else {
        skipped++;
      }
    } catch (err) {
      errors.push(`Error syncing "${movie.title}" (${movie.id}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { processed, songsAdded, songsRemoved, skipped, errors };
}

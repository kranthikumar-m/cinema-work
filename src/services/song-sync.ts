import "server-only";
import { env } from "@/lib/env";

const MAX_SEARCH_RESULTS = 25;
const MAX_SONGS_PER_MOVIE = 15;
const MAX_DURATION_SECONDS = 12 * 60;
const MIN_DURATION_SECONDS = 80;

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
    publishedAt: string;
  };
  contentDetails: {
    duration: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
  };
}

function parseStat(value: string | undefined): number | null {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
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
  /audio\s*jukebox/i,
  /full\s*album/i,
  /all\s*songs/i,
  /songs?\s*jukebox/i,
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
  /mega\s*(hit|mix)/i,
  /dance\s*&?\s*(romance|hits)/i,
  /love\s*hits/i,
  /emotion\s*&?\s*(energy|hits)/i,
  /party\s*songs/i,
  /workout\s*songs/i,
  /sad\s*songs/i,
  /interview/i,
  /press\s*meet/i,
  /making\s*(of|video)/i,
  /behind\s*the\s*scenes/i,
  /bts\b/i,
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

function getSearchDateRange(releaseDate: string | null): { after: string; before: string } | null {
  if (!releaseDate) return null;
  const release = new Date(releaseDate);
  if (isNaN(release.getTime())) return null;
  const after = new Date(release);
  after.setMonth(after.getMonth() - 6);
  const before = new Date(release);
  before.setFullYear(before.getFullYear() + 1);
  return {
    after: after.toISOString(),
    before: before.toISOString(),
  };
}

async function searchYouTube(
  query: string,
  releaseDate: string | null = null,
  maxResults: number = MAX_SEARCH_RESULTS
): Promise<YouTubeSearchItem[]> {
  if (!env.YOUTUBE_API_KEY) return [];

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  const dateRange = getSearchDateRange(releaseDate);
  if (dateRange) {
    url.searchParams.set("publishedAfter", dateRange.after);
    url.searchParams.set("publishedBefore", dateRange.before);
  }

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  return data.items ?? [];
}

async function getVideoDetails(videoIds: string[]): Promise<YouTubeVideoDetail[]> {
  if (!env.YOUTUBE_API_KEY || !videoIds.length) return [];

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  return data.items ?? [];
}

function isUploadDateRelevant(publishedAt: string, releaseDate: string | null): boolean {
  if (!releaseDate) return true;
  const release = new Date(releaseDate);
  const uploaded = new Date(publishedAt);
  if (isNaN(release.getTime()) || isNaN(uploaded.getTime())) return true;
  const diffMs = uploaded.getTime() - release.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= -180 && diffDays <= 365;
}

export interface SongSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds?: number;
  viewCount?: number | null;
  likeCount?: number | null;
}

export async function searchSongsForMovie(
  movieTitle: string,
  releaseDate: string | null = null
): Promise<SongSearchResult[]> {
  const searchItems = await searchYouTube(`"${movieTitle}" Telugu movie songs`, releaseDate);
  if (!searchItems.length) return [];

  const videoIds = searchItems.map((item) => item.id.videoId);
  const details = await getVideoDetails(videoIds);

  const candidates: (SongSearchResult & { score: number })[] = [];

  for (const video of details) {
    const title = video.snippet.title;
    const duration = parseIsoDuration(video.contentDetails.duration);

    if (duration < MIN_DURATION_SECONDS || duration > MAX_DURATION_SECONDS) continue;
    if (isJunkTitle(title)) continue;
    if (!titleMatchesMovie(title, movieTitle)) continue;
    if (!isUploadDateRelevant(video.snippet.publishedAt, releaseDate)) continue;

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

    candidates.push({
      videoId: video.id,
      title,
      channelTitle: video.snippet.channelTitle,
      thumbnailUrl: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
      durationSeconds: duration,
      viewCount: parseStat(video.statistics?.viewCount),
      likeCount: parseStat(video.statistics?.likeCount),
      score,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, MAX_SONGS_PER_MOVIE).map((c) => ({
    videoId: c.videoId,
    title: c.title,
    channelTitle: c.channelTitle,
    thumbnailUrl: c.thumbnailUrl,
    durationSeconds: c.durationSeconds,
    viewCount: c.viewCount,
    likeCount: c.likeCount,
  }));
}

/**
 * Raw song-video candidates for an arbitrary query (movie-level or per-track),
 * filtered ONLY by duration and junk patterns — not by movie title or date — so
 * callers that match against a known track list (the music feature) aren't
 * blocked by movie-name mismatches. Includes view/like stats.
 */
export async function searchYouTubeSongCandidates(
  query: string,
  minDurationSeconds = 30
): Promise<SongSearchResult[]> {
  // 50 results (same quota as 25) for better coverage of large albums.
  const items = await searchYouTube(query, null, 50);
  if (!items.length) return [];

  const details = await getVideoDetails(items.map((item) => item.id.videoId));
  const out: SongSearchResult[] = [];

  for (const video of details) {
    const duration = parseIsoDuration(video.contentDetails.duration);
    if (duration < minDurationSeconds || duration > MAX_DURATION_SECONDS) continue;
    if (isJunkTitle(video.snippet.title)) continue;

    out.push({
      videoId: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      thumbnailUrl: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
      durationSeconds: duration,
      viewCount: parseStat(video.statistics?.viewCount),
      likeCount: parseStat(video.statistics?.likeCount),
    });
  }

  return out;
}

import "server-only";
import { unstable_cache } from "next/cache";
import { env } from "@/lib/env";

/**
 * View counts, likes, duration and upload date for YouTube videos, in one
 * `videos.list` call per 50 ids (1 quota unit each). Cached 6h per id chunk so
 * the video wall and feed never repeat lookups.
 */

export interface YouTubeStats {
  views: number | null;
  likes: number | null;
  durationSeconds: number | null;
  publishedAt: string | null;
}

interface YouTubeVideoItem {
  id: string;
  snippet?: { publishedAt?: string };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string; likeCount?: string };
}

function parseIsoDuration(iso: string | undefined): number | null {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

function parseStat(value: string | undefined): number | null {
  if (value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function fetchStats(ids: string[]): Promise<Record<string, YouTubeStats>> {
  if (!env.YOUTUBE_API_KEY || !ids.length) return {};
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,contentDetails,statistics");
    url.searchParams.set("id", ids.join(","));
    url.searchParams.set("key", env.YOUTUBE_API_KEY);
    const res = await fetch(url.toString());
    if (!res.ok) return {};
    const data = (await res.json()) as { items?: YouTubeVideoItem[] };
    const out: Record<string, YouTubeStats> = {};
    for (const item of data.items ?? []) {
      out[item.id] = {
        views: parseStat(item.statistics?.viewCount),
        likes: parseStat(item.statistics?.likeCount),
        durationSeconds: parseIsoDuration(item.contentDetails?.duration),
        publishedAt: item.snippet?.publishedAt ?? null,
      };
    }
    return out;
  } catch {
    return {};
  }
}

export async function getYouTubeStats(keys: string[]): Promise<Map<string, YouTubeStats>> {
  const unique = Array.from(new Set(keys.filter(Boolean))).sort();
  const result = new Map<string, YouTubeStats>();
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const stats = await unstable_cache(() => fetchStats(chunk), ["yt-stats-v1", chunk.join(",")], {
      revalidate: 21600,
    })();
    for (const [key, value] of Object.entries(stats)) result.set(key, value);
  }
  return result;
}

export function formatDurationSeconds(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

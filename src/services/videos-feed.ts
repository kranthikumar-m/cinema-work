import "server-only";
import { unstable_cache } from "next/cache";
import { getMovieVideos } from "@/services/tmdb";
import {
  getLatestTeluguReleases,
  getUpcomingTeluguMovies,
} from "@/services/telugu-movies";
import { formatDurationSeconds, getYouTubeStats } from "@/services/video-stats";
import {
  hasDatabaseConfiguration,
  listHiddenVideoKeys,
  listMovieVideoRecords,
} from "@/lib/database";
import { classifyVideoTitle, isVideoCategory, type VideoCategory } from "@/lib/video-category";
import type { Movie, Video } from "@/types/tmdb";

/**
 * Site-wide video wall: every known YouTube video for the latest and upcoming
 * Telugu films (TMDB's list plus admin/auto-found rows), categorised, with
 * view counts and durations. Cached 1h.
 */

const LATEST_MOVIES = 18;
const UPCOMING_MOVIES = 6;
const MAX_STATS_LOOKUPS = 150;
const BATCH = 6;

export interface VideoWallItem {
  key: string;
  title: string;
  category: VideoCategory;
  movieId: number;
  movieTitle: string;
  posterPath: string | null;
  publishedAt: string | null;
  views: number | null;
  durationLabel: string | null;
}

async function movieVideos(movie: Movie): Promise<VideoWallItem[]> {
  const [tmdb, rows, hidden] = await Promise.all([
    getMovieVideos(movie.id).catch(() => ({ results: [] as Video[] })),
    hasDatabaseConfiguration() ? listMovieVideoRecords(movie.id).catch(() => []) : Promise.resolve([]),
    hasDatabaseConfiguration() ? listHiddenVideoKeys(movie.id).catch(() => [] as string[]) : Promise.resolve([] as string[]),
  ]);
  const hiddenSet = new Set(hidden);
  const byKey = new Map<string, VideoWallItem>();

  for (const row of rows) {
    if (hiddenSet.has(row.youtube_key)) continue;
    byKey.set(row.youtube_key, {
      key: row.youtube_key,
      title: row.title,
      category: isVideoCategory(row.category) ? row.category : classifyVideoTitle(row.title),
      movieId: movie.id,
      movieTitle: movie.title,
      posterPath: movie.poster_url ?? movie.poster_path,
      publishedAt: row.created_at,
      views: null,
      durationLabel: null,
    });
  }
  for (const video of tmdb.results) {
    if (video.site !== "YouTube" || !video.key || hiddenSet.has(video.key)) continue;
    if (byKey.has(video.key)) continue;
    byKey.set(video.key, {
      key: video.key,
      title: video.name,
      category: classifyVideoTitle(video.name, video.type),
      movieId: movie.id,
      movieTitle: movie.title,
      posterPath: movie.poster_url ?? movie.poster_path,
      publishedAt: video.published_at ?? null,
      views: null,
      durationLabel: null,
    });
  }
  return Array.from(byKey.values());
}

const buildVideoWall = unstable_cache(
  async (): Promise<VideoWallItem[]> => {
    const [latest, upcoming] = await Promise.all([
      getLatestTeluguReleases(LATEST_MOVIES).catch(() => [] as Movie[]),
      getUpcomingTeluguMovies(UPCOMING_MOVIES).catch(() => [] as Movie[]),
    ]);
    const seen = new Set<number>();
    const movies = [...upcoming, ...latest].filter((movie) => {
      if (seen.has(movie.id)) return false;
      seen.add(movie.id);
      return true;
    });

    const items: VideoWallItem[] = [];
    for (let i = 0; i < movies.length; i += BATCH) {
      const batch = movies.slice(i, i + BATCH);
      (await Promise.all(batch.map(movieVideos))).forEach((list) => items.push(...list));
    }

    const stats = await getYouTubeStats(items.slice(0, MAX_STATS_LOOKUPS).map((item) => item.key));
    for (const item of items) {
      const stat = stats.get(item.key);
      if (!stat) continue;
      item.views = stat.views;
      item.durationLabel = formatDurationSeconds(stat.durationSeconds);
      if (stat.publishedAt) item.publishedAt = stat.publishedAt;
    }

    return items.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  },
  ["video-wall-v1"],
  { revalidate: 3600 }
);

export async function getVideoWall(): Promise<VideoWallItem[]> {
  try {
    return await buildVideoWall();
  } catch {
    return [];
  }
}

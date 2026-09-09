import "server-only";
import { unstable_cache } from "next/cache";
import { getMovieImages, getMovieVideos } from "@/services/tmdb";
import {
  getLatestTeluguReleases,
  getUpcomingTeluguMovies,
} from "@/services/telugu-movies";
import { getTeluguNews, type NewsItem } from "@/services/telugu-news";
import { hasDatabaseConfiguration, listMovieVideoRecords } from "@/lib/database";
import { getImageUrl } from "@/lib/utils";
import type { FeedItem } from "@/types/feed";
import type { Movie, Video } from "@/types/tmdb";

/**
 * The homepage feed: one chronological stream mixing stories (news, reviews,
 * interviews, features), trailers and teasers, songs, and photo sets for the
 * latest films. Everything comes from sources the site already fetches; this
 * module only arranges them. Cached 20 minutes as a whole.
 */

const MEDIA_MOVIES = 12;
const UPCOMING_MOVIES = 6;
const PHOTO_MOVIES = 8;
const MIN_STILLS_FOR_PHOTO_SET = 3;
const BATCH = 6;

function youtubeThumb(key: string) {
  return `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
}

function newsToFeed(item: NewsItem): FeedItem {
  return {
    id: item.url,
    kind: item.category,
    title: item.title,
    subtitle: item.sourceLabel,
    image: item.image,
    date: item.publishedAt,
    href: item.url,
    external: true,
  };
}

function pickVideo(list: Video[], type: string): Video | undefined {
  return list.find((v) => v.type === type && v.official) ?? list.find((v) => v.type === type);
}

async function movieMediaItems(movie: Movie): Promise<FeedItem[]> {
  const [rows, tmdb] = await Promise.all([
    hasDatabaseConfiguration() ? listMovieVideoRecords(movie.id).catch(() => []) : Promise.resolve([]),
    getMovieVideos(movie.id).catch(() => ({ results: [] as Video[] })),
  ]);
  const youtube = tmdb.results.filter((v) => v.site === "YouTube" && v.key);
  const items: FeedItem[] = [];

  for (const kind of ["trailer", "teaser"] as const) {
    const tmdbVideo = pickVideo(youtube, kind === "trailer" ? "Trailer" : "Teaser");
    const row = rows.find((r) => r.category === kind);
    const key = tmdbVideo?.key ?? row?.youtube_key;
    if (!key) continue;
    items.push({
      id: `${kind}-${movie.id}-${key}`,
      kind,
      title: movie.title,
      subtitle: tmdbVideo?.name ?? row?.title ?? null,
      image: youtubeThumb(key),
      date: tmdbVideo?.published_at ?? row?.created_at ?? movie.release_date ?? null,
      href: `/movie/${movie.id}?videos=${kind}#videos`,
      external: false,
      movieId: movie.id,
      youtubeKey: key,
    });
  }

  rows
    .filter((r) => r.category === "song")
    .slice(0, 2)
    .forEach((row) => {
      items.push({
        id: `song-${movie.id}-${row.youtube_key}`,
        kind: "song",
        title: row.title,
        subtitle: movie.title,
        image: youtubeThumb(row.youtube_key),
        date: row.created_at,
        href: `/movie/${movie.id}?videos=song#videos`,
        external: false,
        movieId: movie.id,
        youtubeKey: row.youtube_key,
      });
    });

  return items;
}

async function photoSetItem(movie: Movie): Promise<FeedItem | null> {
  try {
    const images = await getMovieImages(movie.id);
    const stills = images.backdrops.filter((img) => img.file_path);
    if (stills.length < MIN_STILLS_FOR_PHOTO_SET) return null;
    return {
      id: `photos-${movie.id}`,
      kind: "photo",
      title: movie.title,
      subtitle: `${stills.length} stills`,
      image: getImageUrl(stills[0].file_path, "w780"),
      date: movie.release_date || null,
      href: `/movie/${movie.id}#gallery`,
      external: false,
      movieId: movie.id,
      meta: { count: stills.length },
    };
  } catch {
    return null;
  }
}

async function inBatches<T, R>(list: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(...(await Promise.all(list.slice(i, i + size).map(fn))));
  }
  return out;
}

function sortFeed(items: FeedItem[]): FeedItem[] {
  const dated = items
    .filter((item) => item.date)
    .sort((a, b) => (b.date as string).localeCompare(a.date as string));
  const undated = items.filter((item) => !item.date);
  return [...dated, ...undated];
}

const buildHomeFeed = unstable_cache(
  async (): Promise<FeedItem[]> => {
    const [news, reviews, interviews, features, latest, upcoming] = await Promise.all([
      getTeluguNews("news", 18).catch(() => [] as NewsItem[]),
      getTeluguNews("review", 8).catch(() => [] as NewsItem[]),
      getTeluguNews("interview", 8).catch(() => [] as NewsItem[]),
      getTeluguNews("feature", 6).catch(() => [] as NewsItem[]),
      getLatestTeluguReleases(MEDIA_MOVIES).catch(() => [] as Movie[]),
      getUpcomingTeluguMovies(UPCOMING_MOVIES).catch(() => [] as Movie[]),
    ]);

    const seen = new Set<number>();
    const movies = [...latest, ...upcoming].filter((movie) => {
      if (seen.has(movie.id)) return false;
      seen.add(movie.id);
      return true;
    });

    const [media, photos] = await Promise.all([
      inBatches(movies, BATCH, movieMediaItems),
      inBatches(latest.slice(0, PHOTO_MOVIES), BATCH, photoSetItem),
    ]);

    const all = [
      ...[...news, ...reviews, ...interviews, ...features].map(newsToFeed),
      ...media.flat(),
      ...photos.filter((item): item is FeedItem => item !== null),
    ];

    const byId = new Map<string, FeedItem>();
    for (const item of all) if (!byId.has(item.id)) byId.set(item.id, item);
    return sortFeed(Array.from(byId.values()));
  },
  ["home-feed-v1"],
  { revalidate: 1200 }
);

export async function getHomeFeed(): Promise<FeedItem[]> {
  try {
    return await buildHomeFeed();
  } catch {
    return [];
  }
}

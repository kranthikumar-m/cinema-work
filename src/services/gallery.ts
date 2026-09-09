import "server-only";
import { unstable_cache } from "next/cache";
import { getMovieImages } from "@/services/tmdb";
import {
  getLatestTeluguReleases,
  getUpcomingTeluguMovies,
} from "@/services/telugu-movies";
import type { Movie, MovieImage } from "@/types/tmdb";

/**
 * Site-wide gallery: stills and posters for the latest and upcoming Telugu
 * films, a few per film so one title never floods the wall. Cached 6h.
 */

const LATEST_MOVIES = 24;
const UPCOMING_MOVIES = 8;
const STILLS_PER_MOVIE = 4;
const POSTERS_PER_MOVIE = 2;
const BATCH = 6;

export type GalleryKind = "still" | "poster";

export interface GalleryWallItem {
  id: string;
  movieId: number;
  movieTitle: string;
  filePath: string;
  kind: GalleryKind;
  aspectRatio: number;
  releaseDate: string;
}

function topImages(list: MovieImage[], limit: number) {
  return [...list]
    .filter((img) => img.file_path)
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0) || b.width - a.width)
    .slice(0, limit);
}

async function movieGallery(movie: Movie): Promise<GalleryWallItem[]> {
  try {
    const images = await getMovieImages(movie.id);
    const toItem = (img: MovieImage, kind: GalleryKind): GalleryWallItem => ({
      id: `${movie.id}:${img.file_path}`,
      movieId: movie.id,
      movieTitle: movie.title,
      filePath: img.file_path,
      kind,
      aspectRatio: img.aspect_ratio || (kind === "still" ? 16 / 9 : 2 / 3),
      releaseDate: movie.release_date || "",
    });
    return [
      ...topImages(images.backdrops, STILLS_PER_MOVIE).map((img) => toItem(img, "still")),
      ...topImages(images.posters, POSTERS_PER_MOVIE).map((img) => toItem(img, "poster")),
    ];
  } catch {
    return [];
  }
}

const buildGalleryWall = unstable_cache(
  async (): Promise<GalleryWallItem[]> => {
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

    const items: GalleryWallItem[] = [];
    for (let i = 0; i < movies.length; i += BATCH) {
      const batch = movies.slice(i, i + BATCH);
      (await Promise.all(batch.map(movieGallery))).forEach((list) => items.push(...list));
    }
    // Newest films first; within a film keep TMDB's quality order.
    return items.sort((a, b) => (b.releaseDate || "9999").localeCompare(a.releaseDate || "9999"));
  },
  ["gallery-wall-v1"],
  { revalidate: 21600 }
);

export async function getGalleryWall(): Promise<GalleryWallItem[]> {
  try {
    return await buildGalleryWall();
  } catch {
    return [];
  }
}

import "server-only";
import { unstable_cache } from "next/cache";
import { findMovieAlbum } from "@/services/spotify";
import { searchSongsForMovie, type SongSearchResult } from "@/services/song-sync";
import { getTitleSimilarityScore } from "@/lib/title-matching";
import {
  hasDatabaseConfiguration,
  listMovieVideoRecords,
  insertMovieVideoRecord,
} from "@/lib/database";

/**
 * On-demand soundtrack for a movie: Spotify album/track list → a YouTube video
 * per track (one quota-friendly search, matched by title) → Genius lyrics.
 * Cached 7 days per movie (so the external calls run once), and matched songs
 * are written into `movie_videos` (category "song") so they also surface in the
 * detail page's Videos → Songs tab. Degrades gracefully when any key/source is
 * missing (album null, no YouTube key, no lyrics → null fields).
 */

const MUSIC_CACHE_SECONDS = 604800; // 7 days
const YOUTUBE_MATCH_MIN_SCORE = 0.7;

export interface MovieSong {
  spotifyId: string;
  trackNumber: number;
  title: string;
  artists: string[];
  durationMs: number;
  youtubeKey: string | null;
  youtubeViews: number | null;
  youtubeLikes: number | null;
  lyrics: string | null;
  geniusUrl: string | null;
}

export interface MovieAlbumInfo {
  name: string;
  imageUrl: string | null;
  releaseDate: string;
  label: string | null;
  musicDirector: string | null;
}

export interface MovieMusic {
  album: MovieAlbumInfo | null;
  songs: MovieSong[];
}

const EMPTY_MUSIC: MovieMusic = { album: null, songs: [] };

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Track title without parenthetical/bracketed qualifiers like "(Telugu)" or
// "(Complex Song)" — these rarely appear verbatim in YouTube song titles.
function coreTitle(value: string): string {
  return normalize(value.replace(/[([][^)\]]*[)\]]/g, " "));
}

// Excluded entirely (compilations, not a single song).
const EXCLUDE_TIER = 99;

/**
 * Ranks a candidate's video TYPE for a track. Lower is preferred:
 *   1 = full Video Song, 2 = lyrical/lyric video, 3 = other single video.
 * Jukeboxes / compilations are excluded outright. Type preference dominates
 * view count, so the official video song wins over a higher-viewed lyric video.
 */
function videoTypeTier(title: string): number {
  const t = title.toLowerCase();
  if (
    /jukebox|full\s*songs|all\s*songs|full\s*album|mashup|non[\s-]?stop|back\s*to\s*back/.test(t)
  ) {
    return EXCLUDE_TIER;
  }
  const hasLyric = /lyric/.test(t);
  const hasVideoSong = /video\s*song/.test(t);
  if (hasVideoSong && !hasLyric) return 1;
  if (hasLyric) return 2;
  return 3;
}

function isTrackMatch(trackTitle: string, normTrack: string, candidate: SongSearchResult): boolean {
  if (normTrack.length >= 4 && normalize(candidate.title).includes(normTrack)) return true;
  return getTitleSimilarityScore(trackTitle, candidate.title) >= YOUTUBE_MATCH_MIN_SCORE;
}

/**
 * Picks the best YouTube video for a Spotify track: among candidates that match
 * the track title (and aren't already used), prefer Video Song → Lyrical →
 * other, breaking ties by view count. Returns null if nothing matches.
 */
function matchYouTube(
  trackTitle: string,
  candidates: SongSearchResult[],
  excludeIds: Set<string>
): SongSearchResult | null {
  const normTrack = coreTitle(trackTitle);
  if (!normTrack) return null;

  const matches = candidates.filter(
    (candidate) =>
      !excludeIds.has(candidate.videoId) &&
      videoTypeTier(candidate.title) !== EXCLUDE_TIER &&
      isTrackMatch(trackTitle, normTrack, candidate)
  );
  if (!matches.length) return null;

  matches.sort((a, b) => {
    const tierDiff = videoTypeTier(a.title) - videoTypeTier(b.title);
    if (tierDiff !== 0) return tierDiff;
    return (b.viewCount ?? 0) - (a.viewCount ?? 0);
  });

  return matches[0];
}

// Adds matched YouTube songs to the movie's videos (category "song"), so they
// also appear in the detail page's Videos → Songs tab. Best-effort.
async function persistSongsToVideos(movieId: number, songs: MovieSong[]): Promise<void> {
  if (!hasDatabaseConfiguration()) return;
  try {
    const existing = await listMovieVideoRecords(movieId);
    const existingKeys = new Set(existing.map((row) => row.youtube_key));
    const createdAt = new Date().toISOString();
    for (const song of songs) {
      if (song.youtubeKey && !existingKeys.has(song.youtubeKey)) {
        await insertMovieVideoRecord({
          movieId,
          youtubeKey: song.youtubeKey,
          title: song.title,
          category: "song",
          addedByUserId: null,
          createdAt,
        });
        existingKeys.add(song.youtubeKey);
      }
    }
  } catch {
    /* non-critical */
  }
}

async function buildMovieMusic(
  movieId: number,
  movieTitle: string,
  releaseDate: string | null
): Promise<MovieMusic> {
  const parsedYear = releaseDate ? Number.parseInt(releaseDate.slice(0, 4), 10) : NaN;
  const album = await findMovieAlbum(
    movieTitle,
    Number.isFinite(parsedYear) ? parsedYear : null
  );
  if (!album || !album.tracks.length) return EMPTY_MUSIC;

  // One YouTube search for the whole movie (quota-friendly). Release date is
  // intentionally NOT passed — song uploads often fall outside a movie's
  // release window, and we match candidates by Spotify track title anyway.
  const youtubeCandidates = await searchSongsForMovie(movieTitle, null).catch(
    () => [] as SongSearchResult[]
  );

  const usedVideoIds = new Set<string>();
  const songs: MovieSong[] = album.tracks.map((track) => {
    const match = matchYouTube(track.title, youtubeCandidates, usedVideoIds);
    const videoId = match?.videoId ?? null;
    if (videoId) usedVideoIds.add(videoId);

    return {
      spotifyId: track.spotifyId,
      trackNumber: track.trackNumber,
      title: track.title,
      artists: track.artists,
      durationMs: track.durationMs,
      youtubeKey: videoId,
      youtubeViews: videoId ? match?.viewCount ?? null : null,
      youtubeLikes: videoId ? match?.likeCount ?? null : null,
      lyrics: null,
      geniusUrl: null,
    };
  });

  await persistSongsToVideos(movieId, songs);

  return {
    album: {
      name: album.name,
      imageUrl: album.imageUrl,
      releaseDate: album.releaseDate,
      label: album.label,
      musicDirector: album.primaryArtist,
    },
    songs,
  };
}

export function getMovieMusic(
  movieId: number,
  movieTitle: string,
  releaseDate: string | null
): Promise<MovieMusic> {
  return unstable_cache(
    () => buildMovieMusic(movieId, movieTitle, releaseDate),
    ["movie-music-v2", String(movieId)],
    { revalidate: MUSIC_CACHE_SECONDS, tags: [`movie-music-${movieId}`] }
  )();
}

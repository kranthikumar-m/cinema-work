import "server-only";
import { unstable_cache } from "next/cache";
import { findMovieAlbum } from "@/services/spotify";
import { getLyricsForTrack } from "@/services/genius";
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
const YOUTUBE_MATCH_MIN_SCORE = 0.55;

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

function matchYouTube(
  trackTitle: string,
  candidates: SongSearchResult[]
): SongSearchResult | null {
  const normTrack = normalize(trackTitle);
  if (!normTrack) return null;

  let best: SongSearchResult | null = null;
  let bestScore = 0;
  for (const candidate of candidates) {
    let score = getTitleSimilarityScore(trackTitle, candidate.title);
    // A YouTube title that contains the exact track name is a strong match,
    // e.g. "College Papa Video Song | MAD | Bheems…".
    if (normTrack.length >= 4 && normalize(candidate.title).includes(normTrack)) {
      score = Math.max(score, 0.9);
    }
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return bestScore >= YOUTUBE_MATCH_MIN_SCORE ? best : null;
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

  // One YouTube search for the whole movie (quota-friendly).
  const youtubeCandidates = await searchSongsForMovie(movieTitle, releaseDate).catch(
    () => [] as SongSearchResult[]
  );

  // Lyrics in parallel (per track), best-effort.
  const lyricsResults = await Promise.all(
    album.tracks.map((track) =>
      getLyricsForTrack(track.title, track.artists[0]).catch(() => null)
    )
  );

  const usedVideoIds = new Set<string>();
  const songs: MovieSong[] = album.tracks.map((track, index) => {
    const match = matchYouTube(track.title, youtubeCandidates);
    const videoId = match && !usedVideoIds.has(match.videoId) ? match.videoId : null;
    if (videoId) usedVideoIds.add(videoId);
    const lyrics = lyricsResults[index];

    return {
      spotifyId: track.spotifyId,
      trackNumber: track.trackNumber,
      title: track.title,
      artists: track.artists,
      durationMs: track.durationMs,
      youtubeKey: videoId,
      youtubeViews: videoId ? match?.viewCount ?? null : null,
      youtubeLikes: videoId ? match?.likeCount ?? null : null,
      lyrics: lyrics?.lyrics ?? null,
      geniusUrl: lyrics?.url ?? null,
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
    ["movie-music", String(movieId)],
    { revalidate: MUSIC_CACHE_SECONDS, tags: [`movie-music-${movieId}`] }
  )();
}

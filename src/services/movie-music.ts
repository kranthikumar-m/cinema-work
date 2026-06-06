import "server-only";
import { unstable_cache } from "next/cache";
import { findMovieAlbum, type SpotifyTrack } from "@/services/spotify";
import { searchYouTubeSongCandidates, type SongSearchResult } from "@/services/song-sync";
import {
  getTitleSimilarityScore,
  getTeluguTitleSimilarityScore,
  canonicalizeTeluguRomanization,
} from "@/lib/title-matching";
import {
  hasDatabaseConfiguration,
  listMovieVideoRecords,
  insertMovieVideoRecord,
} from "@/lib/database";

/**
 * On-demand soundtrack for a movie: Spotify album/track list → a YouTube video
 * per track. One movie-level search covers the popular songs; tracks it misses
 * fall back to a bounded number of per-track searches. Each track is matched by
 * title (qualifiers like "(Telugu)" stripped) preferring Video Song → Lyrical →
 * other, never jukeboxes. Cached 7 days per movie, and matched songs are written
 * into `movie_videos` (category "song") so they also surface in the detail
 * page's Videos → Songs tab. Degrades gracefully when a key/source is missing.
 */

const MUSIC_CACHE_SECONDS = 604800; // 7 days
const YOUTUBE_MATCH_MIN_SCORE = 0.7;
// Max extra per-track YouTube searches per movie (bounds quota for big albums).
const MAX_TRACK_SEARCHES = 8;

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

function isTrackMatch(
  trackTitle: string,
  normTrack: string,
  candidate: SongSearchResult,
  isTelugu: boolean
): boolean {
  if (normTrack.length >= 4 && normalize(candidate.title).includes(normTrack)) return true;
  if (isTelugu) {
    // Match across romanization variants (e.g. "Yeevvaa Yeevva" vs "Yevva Yevva").
    const canonicalTrack = canonicalizeTeluguRomanization(trackTitle);
    const canonicalCandidate = canonicalizeTeluguRomanization(candidate.title);
    if (canonicalTrack.length >= 4 && canonicalCandidate.includes(canonicalTrack)) return true;
    return getTeluguTitleSimilarityScore(trackTitle, candidate.title) >= YOUTUBE_MATCH_MIN_SCORE;
  }
  return getTitleSimilarityScore(trackTitle, candidate.title) >= YOUTUBE_MATCH_MIN_SCORE;
}

// Known music-label / official uploaders — strongly preferred over fan channels.
const OFFICIAL_CHANNEL_HINTS = [
  "saregama", "sony music", "aditya music", "lahari", "mango music", "t-series",
  "tseries", "anand audio", "think music", "divo", "muzik247", "junglee music",
  "zee music", "speed records", "madhura audio", "amrutha", "geetha arts",
];
const OTHER_LANGUAGE_RE = /\b(tamil|hindi|kannada|malayalam|bengali|marathi)\b/;

function isOfficialChannel(channel: string): boolean {
  const c = channel.toLowerCase();
  return OFFICIAL_CHANNEL_HINTS.some((hint) => c.includes(hint));
}

/**
 * Scores a candidate for a track. Correctness signals (official uploader, a
 * duration close to the Spotify track, the Telugu cut) dominate, with the
 * Video Song > Lyrical > other type preference and view count as lighter
 * signals. This keeps an official "audio"/theme above a higher-viewed fan
 * "lyrical" tribute, and the Telugu version above other-language cuts.
 */
function scoreCandidate(trackDurationSec: number, candidate: SongSearchResult): number {
  let score = 0;
  const title = candidate.title.toLowerCase();

  if (isOfficialChannel(candidate.channelTitle)) score += 100;

  if (/telugu/.test(title)) score += 10;
  else if (OTHER_LANGUAGE_RE.test(title)) score -= 60;

  const delta = Math.abs((candidate.durationSeconds ?? 0) - trackDurationSec);
  if (delta <= 15) score += 50;
  else if (delta <= 40) score += 25;
  else if (delta >= 90) score -= 40;

  score += (4 - videoTypeTier(candidate.title)) * 12;
  score += Math.min(8, Math.log10((candidate.viewCount ?? 0) + 1));

  return score;
}

/**
 * Picks the best YouTube video for a Spotify track: among candidates whose
 * title matches the track (and aren't already used), the highest-scoring one
 * (see scoreCandidate). Returns null if nothing matches.
 */
function matchYouTube(
  track: { title: string; durationMs: number },
  candidates: SongSearchResult[],
  excludeIds: Set<string>,
  isTelugu: boolean
): SongSearchResult | null {
  const normTrack = coreTitle(track.title);
  if (!normTrack) return null;
  const trackDurationSec = track.durationMs / 1000;

  const matches = candidates.filter(
    (candidate) =>
      !excludeIds.has(candidate.videoId) &&
      videoTypeTier(candidate.title) !== EXCLUDE_TIER &&
      isTrackMatch(track.title, normTrack, candidate, isTelugu)
  );
  if (!matches.length) return null;

  matches.sort(
    (a, b) => scoreCandidate(trackDurationSec, b) - scoreCandidate(trackDurationSec, a)
  );
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

function cleanForQuery(value: string): string {
  return value
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toSong(track: SpotifyTrack, match: SongSearchResult | null): MovieSong {
  return {
    spotifyId: track.spotifyId,
    trackNumber: track.trackNumber,
    title: track.title,
    artists: track.artists,
    durationMs: track.durationMs,
    youtubeKey: match?.videoId ?? null,
    youtubeViews: match?.viewCount ?? null,
    youtubeLikes: match?.likeCount ?? null,
    lyrics: null,
    geniusUrl: null,
  };
}

async function buildMovieMusic(
  movieId: number,
  movieTitle: string,
  releaseDate: string | null,
  isTelugu: boolean
): Promise<MovieMusic> {
  const parsedYear = releaseDate ? Number.parseInt(releaseDate.slice(0, 4), 10) : NaN;
  const album = await findMovieAlbum(
    movieTitle,
    Number.isFinite(parsedYear) ? parsedYear : null,
    { isTelugu }
  );
  if (!album || !album.tracks.length) return EMPTY_MUSIC;

  // For Telugu, collapse doubled letters in the search term ("Raakaasa" →
  // "Rakasa") so YouTube surfaces the videos, which use the shorter spelling.
  const searchTitle = isTelugu
    ? movieTitle.replace(/([a-zA-Z])\1+/g, "$1")
    : movieTitle;
  const cleanTitle = cleanForQuery(searchTitle);
  const usedVideoIds = new Set<string>();

  // 1) One movie-level search covers the popular songs (quota-friendly). No
  // movie-title or date filtering — we match candidates by Spotify track title.
  const movieCandidates = await searchYouTubeSongCandidates(
    `"${cleanTitle}" Telugu movie songs`
  ).catch(() => [] as SongSearchResult[]);

  const songs: MovieSong[] = album.tracks.map((track) => {
    const match = matchYouTube(track, movieCandidates, usedVideoIds, isTelugu);
    if (match) usedVideoIds.add(match.videoId);
    return toSong(track, match);
  });

  // 2) Per-track fallback for songs the movie-level search missed (bounded to
  // keep YouTube quota in check). Sequential to respect rate limits.
  let budget = MAX_TRACK_SEARCHES;
  for (let i = 0; i < songs.length && budget > 0; i += 1) {
    if (songs[i].youtubeKey) continue;
    budget -= 1;
    const track = album.tracks[i];
    const candidates = await searchYouTubeSongCandidates(
      `${coreTitle(track.title)} ${cleanTitle} song`
    ).catch(() => [] as SongSearchResult[]);
    const match = matchYouTube(track, candidates, usedVideoIds, isTelugu);
    if (match) {
      usedVideoIds.add(match.videoId);
      songs[i] = toSong(track, match);
    }
  }

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
  releaseDate: string | null,
  isTelugu = false
): Promise<MovieMusic> {
  return unstable_cache(
    () => buildMovieMusic(movieId, movieTitle, releaseDate, isTelugu),
    // v5: Telugu transliteration-aware album/track matching (also busts the
    // stale "no soundtrack" caches for titles like "Raakaasa").
    ["movie-music-v5", String(movieId)],
    { revalidate: MUSIC_CACHE_SECONDS, tags: [`movie-music-${movieId}`] }
  )();
}

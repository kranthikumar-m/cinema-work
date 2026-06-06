import "server-only";
import { unstable_cache } from "next/cache";
import { getMovieVideos } from "@/services/tmdb";
import {
  searchYouTubeTrailerCandidates,
  type SongSearchResult,
} from "@/services/song-sync";
import { getTitleSimilarityScore } from "@/lib/title-matching";
import {
  hasDatabaseConfiguration,
  listMovieVideoRecords,
  insertMovieVideoRecord,
} from "@/lib/database";

/**
 * On-demand trailer + teaser for a movie. TMDB's own YouTube trailers/teasers
 * are used when present; when a category is missing, a bounded YouTube search
 * fills it (mirroring the song-video flow) and the match is persisted into
 * `movie_videos` so it also surfaces in the admin panel / home hero. Cached
 * 7 days per movie. Degrades gracefully when a key/source is missing.
 */

const TRAILERS_CACHE_SECONDS = 604800; // 7 days

export type TrailerKind = "trailer" | "teaser";

export interface MovieTrailerVideo {
  youtubeKey: string;
  title: string;
  category: TrailerKind;
  source: "tmdb" | "youtube";
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Movie title without parenthetical/bracketed qualifiers like "(2024)".
function coreTitle(value: string): string {
  return normalize(value.replace(/[([][^)\]]*[)\]]/g, " "));
}

function cleanForQuery(value: string): string {
  return value
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Production houses / labels that post official Telugu trailers & teasers.
const OFFICIAL_CHANNEL_HINTS = [
  "mythri movie makers", "geetha arts", "sri venkateswara creations",
  "uv creations", "haarika", "dvv entertainment", "sithara entertainments",
  "vyjayanthi", "t-series", "tseries", "aditya music", "saregama",
  "sony music", "lahari", "mango", "goldmines", "zee", "netflix", "prime video",
  "konidela", "annapurna studios", "people media factory", "vriddhi",
];
const OTHER_LANGUAGE_RE = /\b(tamil|hindi|kannada|malayalam|bengali|marathi)\b/;
// Reject videos that clearly aren't a clean trailer/teaser.
const NON_PROMO_RE =
  /jukebox|\bsong\b|lyric|full\s*movie|movie\s*scene|public\s*talk|review|reaction|making|behind|interview|press\s*meet|deleted|explained/;

function isOfficialChannel(channel: string): boolean {
  const c = channel.toLowerCase();
  return OFFICIAL_CHANNEL_HINTS.some((hint) => c.includes(hint));
}

function referencesMovie(movieCore: string, candidateTitle: string): boolean {
  if (movieCore.length >= 3 && normalize(candidateTitle).includes(movieCore)) return true;
  return getTitleSimilarityScore(movieCore, candidateTitle) >= 0.6;
}

function scoreTrailerCandidate(kind: TrailerKind, candidate: SongSearchResult): number {
  let score = 0;
  const title = candidate.title.toLowerCase();

  if (isOfficialChannel(candidate.channelTitle)) score += 100;
  if (/\bofficial\b/.test(title)) score += 15;
  if (/telugu/.test(title)) score += 10;
  else if (OTHER_LANGUAGE_RE.test(title)) score -= 40;
  // Exact kind keyword in the title is a strong signal.
  if (new RegExp(`\\b${kind}\\b`).test(title)) score += 12;
  score += Math.min(8, Math.log10((candidate.viewCount ?? 0) + 1));

  return score;
}

/**
 * Picks the best YouTube promo for a kind ("trailer" | "teaser"): a candidate
 * that references the movie, names the kind, and isn't a song/clip/review.
 */
function pickTrailerCandidate(
  movieTitle: string,
  kind: TrailerKind,
  candidates: SongSearchResult[]
): SongSearchResult | null {
  const core = coreTitle(movieTitle);
  const matches = candidates
    .filter((candidate) => {
      const title = candidate.title.toLowerCase();
      if (NON_PROMO_RE.test(title)) return false;
      if (!new RegExp(`\\b${kind}\\b`).test(title)) return false;
      return referencesMovie(core, candidate.title);
    })
    .map((candidate) => ({ candidate, score: scoreTrailerCandidate(kind, candidate) }))
    .sort((a, b) => b.score - a.score);

  return matches[0]?.candidate ?? null;
}

async function persistTrailer(
  movieId: number,
  youtubeKey: string,
  title: string,
  category: TrailerKind
): Promise<void> {
  if (!hasDatabaseConfiguration()) return;
  try {
    const existing = await listMovieVideoRecords(movieId);
    if (existing.some((row) => row.youtube_key === youtubeKey)) return;
    await insertMovieVideoRecord({
      movieId,
      youtubeKey,
      title,
      category,
      addedByUserId: null,
      createdAt: new Date().toISOString(),
    });
  } catch {
    /* non-critical */
  }
}

async function fillKind(
  movieId: number,
  movieTitle: string,
  cleanTitle: string,
  kind: TrailerKind
): Promise<MovieTrailerVideo | null> {
  const candidates = await searchYouTubeTrailerCandidates(
    `${cleanTitle} Telugu movie ${kind}`
  ).catch(() => [] as SongSearchResult[]);
  const best = pickTrailerCandidate(movieTitle, kind, candidates);
  if (!best) return null;
  await persistTrailer(movieId, best.videoId, best.title, kind);
  return { youtubeKey: best.videoId, title: best.title, category: kind, source: "youtube" };
}

async function buildMovieTrailers(
  movieId: number,
  movieTitle: string
): Promise<MovieTrailerVideo[]> {
  let tmdbVideos: { key: string; name: string; site: string; type: string; official: boolean }[] = [];
  try {
    tmdbVideos = (await getMovieVideos(movieId)).results;
  } catch {
    tmdbVideos = [];
  }

  const youtube = tmdbVideos.filter((v) => v.site === "YouTube" && v.key);
  const byOfficial = (a: { official: boolean }, b: { official: boolean }) =>
    Number(b.official) - Number(a.official);
  const tmdbTrailers = youtube.filter((v) => v.type === "Trailer").sort(byOfficial);
  const tmdbTeasers = youtube.filter((v) => v.type === "Teaser").sort(byOfficial);

  const cleanTitle = cleanForQuery(movieTitle);
  const out: MovieTrailerVideo[] = [];

  if (tmdbTrailers.length) {
    for (const v of tmdbTrailers) {
      out.push({ youtubeKey: v.key, title: v.name, category: "trailer", source: "tmdb" });
    }
  } else {
    const filled = await fillKind(movieId, movieTitle, cleanTitle, "trailer");
    if (filled) out.push(filled);
  }

  if (tmdbTeasers.length) {
    for (const v of tmdbTeasers) {
      out.push({ youtubeKey: v.key, title: v.name, category: "teaser", source: "tmdb" });
    }
  } else {
    const filled = await fillKind(movieId, movieTitle, cleanTitle, "teaser");
    if (filled) out.push(filled);
  }

  // Dedupe by key in case a single video was tagged under both kinds.
  const seen = new Set<string>();
  return out.filter((v) => (seen.has(v.youtubeKey) ? false : (seen.add(v.youtubeKey), true)));
}

export function getMovieTrailers(
  movieId: number,
  movieTitle: string
): Promise<MovieTrailerVideo[]> {
  return unstable_cache(
    () => buildMovieTrailers(movieId, movieTitle),
    ["movie-trailers-v1", String(movieId)],
    { revalidate: TRAILERS_CACHE_SECONDS, tags: [`movie-trailers-${movieId}`] }
  )();
}

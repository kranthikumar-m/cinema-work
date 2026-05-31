import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  discoverMovies,
  getMovieDetails,
  searchMovies,
} from "@/services/tmdb";
import {
  daysBetweenIsoDates,
  getIndianCurrentYear,
  getIndianTodayIsoDate,
} from "@/lib/date";
import { getTitleSimilarityScore, normalizeMovieTitle } from "@/lib/title-matching";
import { getWikipediaTeluguReleases } from "@/services/wikipedia";
import { getMovieFallbackAssets } from "@/services/google-images";
import { getManuallyAddedMovies, mergeUnique } from "@/services/manual-movies";
import {
  appendValidatedYearMovies,
  hasDatabaseConfiguration,
  isValidatedYearFrozen,
  listTrendingSignalRecords,
  listValidatedYearMovieRecords,
  listValidatedYearProgressRecords,
  markValidatedYearQuarter,
  upsertValidatedYearFreeze,
} from "@/lib/database";
import type { DatabaseTrendingSignalRow } from "@/lib/database";
import type {
  Movie,
  MovieDetails,
  MovieValidation,
  PaginatedResponse,
} from "@/types/tmdb";

const TELUGU_LANGUAGE = "te";
const INDIA_REGION = "IN";
const MAX_DISCOVER_PAGES = 5;
const DEFAULT_COLLECTION_LIMIT = 24;
const VALIDATED_RELEASE_LOOKBACK_YEARS = 8;

// Title-based Wikipedia matching thresholds (date is a confidence signal, not a gate).
const WIKI_MATCH_STRONG_SCORE = 0.85;
const WIKI_MATCH_DATED_SCORE = 0.72;
const WIKI_MATCH_DATE_WINDOW_DAYS = 45;
// Per-quarter discover paging. Narrow date windows page deeper than a single
// full-year query and keep each request small (no 429 bursts).
const VALIDATION_DISCOVER_MAX_PAGES = 10;
const VALIDATION_DISCOVER_MIN_RESULTS = 200;
// How many quarter chunks the background backfill processes per cron run
// (4 = one whole year), and the gentle delay between chunks.
const MAX_QUARTERS_PER_RUN = 4;
const FREEZE_YEAR_DELAY_MS = 750;

// Cache tag for the validated catalog, so the admin refresh can purge it.
export const VALIDATED_CATALOG_CACHE_TAG = "validated-telugu-catalog";

// Quarter date windows [gte, lte] (suffix appended to the year).
const QUARTER_WINDOWS: Record<number, [string, string]> = {
  1: ["01-01", "03-31"],
  2: ["04-01", "06-30"],
  3: ["07-01", "09-30"],
  4: ["10-01", "12-31"],
};

function dedupeMovies(movies: Movie[]) {
  const deduped = new Map<number, Movie>();

  movies.forEach((movie) => {
    deduped.set(movie.id, movie);
  });

  return Array.from(deduped.values());
}

function sortByReleaseDateDescAndPopularity(movies: Movie[]) {
  return [...movies].sort((a, b) => {
    const dateScore = (b.release_date || "").localeCompare(a.release_date || "");

    if (dateScore !== 0) {
      return dateScore;
    }

    return b.popularity - a.popularity;
  });
}

function sortByPopularity(movies: Movie[]) {
  return [...movies].sort((a, b) => b.popularity - a.popularity);
}

function buildValidation(
  status: MovieValidation["status"],
  reason?: string,
  matchedBy?: MovieValidation["matchedBy"],
  wikipediaTitle?: string,
  wikipediaPageTitle?: string,
  wikipediaReleaseDate?: string
): MovieValidation {
  return {
    status,
    reason,
    matchedBy,
    wikipediaTitle,
    wikipediaPageTitle,
    wikipediaReleaseDate,
  };
}

async function withMovieAssets<T extends Movie>(movie: T): Promise<T> {
  const fallbackAssets =
    movie.poster_path && movie.backdrop_path
      ? { posterUrl: null, backdropUrl: null }
      : await getMovieFallbackAssets(movie);

  return {
    ...movie,
    poster_url: movie.poster_url ?? fallbackAssets.posterUrl,
    backdrop_url: movie.backdrop_url ?? fallbackAssets.backdropUrl,
    asset_sources: {
      poster: movie.poster_path
        ? "tmdb"
        : fallbackAssets.posterUrl
          ? "google_fallback"
          : "placeholder",
      backdrop: movie.backdrop_path
        ? "tmdb"
        : fallbackAssets.backdropUrl
          ? "google_fallback"
          : "placeholder",
    },
  } as T;
}

async function withMovieAssetList(movies: Movie[]) {
  const enriched: Movie[] = [];

  for (const movie of movies) {
    enriched.push(await withMovieAssets(movie));
  }

  return enriched;
}

type WikipediaReleaseEntry =
  Awaited<ReturnType<typeof getWikipediaTeluguReleases>>["releases"][number];

type WikipediaMatchResult =
  | {
      status: "validated";
      matchedBy: MovieValidation["matchedBy"];
      entry: WikipediaReleaseEntry;
      score: number;
    }
  | {
      status: "not_found";
    };

/**
 * Validates a movie against a year's Wikipedia release list by TITLE similarity.
 * The release date is only a confidence signal (postponements routinely make
 * TMDB and Wikipedia dates disagree), never a hard gate: a strong title match
 * validates on its own, and a moderate title match validates when the dates are
 * close.
 */
function findWikipediaMatch(
  movie: Movie,
  entries: WikipediaReleaseEntry[]
): WikipediaMatchResult {
  const normalizedTitle = normalizeMovieTitle(movie.title);

  let best: { entry: WikipediaReleaseEntry; score: number } | null = null;
  for (const entry of entries) {
    const score = getTitleSimilarityScore(movie.title, entry.title);
    if (!best || score > best.score) {
      best = { entry, score };
    }
  }

  if (!best) {
    return { status: "not_found" };
  }

  const dateDiff = daysBetweenIsoDates(movie.release_date, best.entry.releaseDate);
  const datesClose = dateDiff !== null && dateDiff <= WIKI_MATCH_DATE_WINDOW_DAYS;

  if (
    best.score >= WIKI_MATCH_STRONG_SCORE ||
    (best.score >= WIKI_MATCH_DATED_SCORE && datesClose)
  ) {
    return {
      status: "validated",
      entry: best.entry,
      matchedBy: normalizedTitle === best.entry.normalizedTitle ? "exact" : "fuzzy",
      score: best.score,
    };
  }

  return { status: "not_found" };
}

async function collectDiscoveredTeluguMovies(
  params: Record<string, string>,
  {
    minResults = DEFAULT_COLLECTION_LIMIT,
    maxPages = MAX_DISCOVER_PAGES,
  }: {
    minResults?: number;
    maxPages?: number;
  } = {}
) {
  const collected: Movie[] = [];

  for (let page = 1; page <= maxPages && collected.length < minResults; page += 1) {
    const response = await discoverMovies(
      {
        include_adult: "false",
        include_video: "false",
        region: INDIA_REGION,
        with_original_language: TELUGU_LANGUAGE,
        ...params,
      },
      page
    );

    collected.push(...response.results);

    if (page >= response.total_pages) {
      break;
    }
  }

  return dedupeMovies(collected);
}

type WikipediaReleaseList =
  Awaited<ReturnType<typeof getWikipediaTeluguReleases>>["releases"];

/**
 * Validates TMDB discover candidates against a year's Wikipedia release list by
 * title (see {@link findWikipediaMatch}). discover already filters to
 * original_language=te, so language is trusted. Wikipedia titles with no TMDB
 * discover hit are intentionally NOT searched per-title — Telugu lists run to
 * hundreds of obscure entries per year and a search sweep bursts the APIs.
 */
async function validateCandidatesAgainstWikipedia(
  candidates: Movie[],
  wikipediaReleases: WikipediaReleaseList
): Promise<Movie[]> {
  const confirmed: Movie[] = [];

  for (const candidate of candidates) {
    if (!candidate.release_date) continue;

    const match = findWikipediaMatch(candidate, wikipediaReleases);
    if (match.status !== "validated") continue;

    confirmed.push(
      await withMovieAssets({
        ...candidate,
        validation: buildValidation(
          "validated",
          undefined,
          match.matchedBy,
          match.entry.title,
          match.entry.pageTitle,
          match.entry.releaseDate
        ),
      })
    );
  }

  return confirmed;
}

/**
 * Validates the in-progress (current) year as a single whole-year query. Cheap
 * enough to run live on a cache miss; cached 6h by the catalog. Past years go
 * through {@link validateTeluguQuarter} in the background instead.
 */
export const getValidatedTeluguReleasesThisYear = cache(
  async (year = getIndianCurrentYear()): Promise<Movie[]> => {
    const today = getIndianTodayIsoDate();
    const upperBound = year >= getIndianCurrentYear() ? today : `${year}-12-31`;

    const wikipediaDataset = await getWikipediaTeluguReleases(year);
    const tmdbCandidates = await collectDiscoveredTeluguMovies(
      {
        sort_by: "primary_release_date.desc",
        "primary_release_date.gte": `${year}-01-01`,
        "primary_release_date.lte": upperBound,
      },
      {
        minResults: VALIDATION_DISCOVER_MIN_RESULTS,
        maxPages: VALIDATION_DISCOVER_MAX_PAGES,
      }
    );

    const confirmed = await validateCandidatesAgainstWikipedia(
      tmdbCandidates,
      wikipediaDataset.releases
    );

    return sortByReleaseDateDescAndPopularity(dedupeMovies(confirmed));
  }
);

/**
 * Validates one quarter of a (completed) year. Narrow date windows let discover
 * page deeper than a single full-year query, improving coverage of busy years.
 */
async function validateTeluguQuarter(year: number, quarter: number): Promise<Movie[]> {
  const window = QUARTER_WINDOWS[quarter];
  if (!window) return [];

  const today = getIndianTodayIsoDate();
  const gte = `${year}-${window[0]}`;
  let lte = `${year}-${window[1]}`;
  if (lte > today) lte = today; // never reach into the future

  const wikipediaDataset = await getWikipediaTeluguReleases(year);
  const tmdbCandidates = await collectDiscoveredTeluguMovies(
    {
      sort_by: "primary_release_date.desc",
      "primary_release_date.gte": gte,
      "primary_release_date.lte": lte,
    },
    {
      minResults: VALIDATION_DISCOVER_MIN_RESULTS,
      maxPages: VALIDATION_DISCOVER_MAX_PAGES,
    }
  );

  return validateCandidatesAgainstWikipedia(tmdbCandidates, wikipediaDataset.releases);
}

const RECENT_RELEASE_WINDOW_DAYS = 30;
const MENTION_TRENDING_THRESHOLD = 10;

function isoDaysAgo(todayIso: string, days: number): string {
  const date = new Date(`${todayIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/**
 * Places admin-pinned, still-unreleased movies at their saved positions, filling
 * the remaining slots with the natural (recent-releases + mention-sorted) order.
 * Pinned movies that have since released are ignored and revert to natural order.
 */
function applyAdminPins(
  naturalOrder: Movie[],
  signals: DatabaseTrendingSignalRow[],
  candidateById: Map<number, Movie>,
  todayIso: string
): Movie[] {
  const pins = signals
    .filter((signal) => signal.admin_pinned && signal.admin_order !== null)
    .map((signal) => ({
      order: signal.admin_order as number,
      movie: candidateById.get(signal.movie_id),
    }))
    .filter(
      (pin): pin is { order: number; movie: Movie } =>
        Boolean(pin.movie) &&
        Boolean(pin.movie!.release_date) &&
        (pin.movie!.release_date as string) > todayIso
    )
    .sort((a, b) => a.order - b.order);

  if (!pins.length) return naturalOrder;

  const pinnedIds = new Set(pins.map((pin) => pin.movie.id));
  const fillers = naturalOrder.filter((movie) => !pinnedIds.has(movie.id));

  const result: Movie[] = [];
  let pinPtr = 0;
  let index = 0;

  while (fillers.length || pinPtr < pins.length) {
    if (pinPtr < pins.length && pins[pinPtr].order === index) {
      result.push(pins[pinPtr].movie);
      pinPtr += 1;
    } else if (fillers.length) {
      result.push(fillers.shift() as Movie);
    } else {
      // No fillers left — flush remaining pins regardless of their saved index.
      result.push(pins[pinPtr].movie);
      pinPtr += 1;
    }
    index += 1;
  }

  return result;
}

export async function getTeluguTrendingMovies(limit = DEFAULT_COLLECTION_LIMIT) {
  const today = getIndianTodayIsoDate();

  const [released, upcoming, signals] = await Promise.all([
    getLatestTeluguReleases(limit * 2),
    getUpcomingTeluguMovies(limit * 2),
    listTrendingSignalRecords().catch(() => [] as DatabaseTrendingSignalRow[]),
  ]);

  const candidates = dedupeMovies([...released, ...upcoming]);
  const candidateById = new Map(candidates.map((movie) => [movie.id, movie]));
  const mentionByMovieId = new Map(
    signals.map((signal) => [signal.movie_id, signal.mention_count])
  );

  // Band 1 — recent releases (within the window), newest first.
  const windowStart = isoDaysAgo(today, RECENT_RELEASE_WINDOW_DAYS);
  const recentReleases = released
    .filter(
      (movie) =>
        movie.release_date &&
        movie.release_date <= today &&
        movie.release_date >= windowStart
    )
    .sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""));

  // Band 2 — anything with >10 mentions in the last 48h, by mention count desc.
  const recentIds = new Set(recentReleases.map((movie) => movie.id));
  const mentionTrending = candidates
    .filter((movie) => !recentIds.has(movie.id))
    .map((movie) => ({ movie, count: mentionByMovieId.get(movie.id) ?? 0 }))
    .filter((entry) => entry.count > MENTION_TRENDING_THRESHOLD)
    .sort((a, b) => b.count - a.count)
    .map((entry) => entry.movie);

  const naturalOrder = mergeUnique(recentReleases, mentionTrending);

  // Band 3 — admin-pinned unreleased movies hold their positions.
  const finalOrder = applyAdminPins(naturalOrder, signals, candidateById, today);

  return withMovieAssetList(finalOrder.slice(0, limit));
}

export async function getPopularTeluguMovies(limit = DEFAULT_COLLECTION_LIMIT) {
  const movies = await collectDiscoveredTeluguMovies(
    {
      sort_by: "popularity.desc",
      "primary_release_date.lte": getIndianTodayIsoDate(),
      "vote_count.gte": "15",
    },
    { minResults: limit * 2 }
  );

  return withMovieAssetList(sortByPopularity(movies).slice(0, limit));
}

export async function getTopRatedTeluguMovies(limit = DEFAULT_COLLECTION_LIMIT) {
  const movies = await collectDiscoveredTeluguMovies(
    {
      sort_by: "vote_average.desc",
      "primary_release_date.lte": getIndianTodayIsoDate(),
      "vote_count.gte": "50",
    },
    { minResults: limit * 2 }
  );

  return withMovieAssetList(movies.slice(0, limit));
}

export async function getUpcomingTeluguMovies(limit = DEFAULT_COLLECTION_LIMIT) {
  const today = getIndianTodayIsoDate();
  const discovered = await collectDiscoveredTeluguMovies(
    {
      sort_by: "primary_release_date.asc",
      "primary_release_date.gte": today,
    },
    { minResults: limit * 2 }
  );

  // Fold in admin-added movies whose release date is in the future (or unknown).
  const manual = await getManuallyAddedMovies().catch(() => [] as Movie[]);
  const manualUpcoming = manual.filter(
    (movie) => !movie.release_date || movie.release_date > today
  );

  const merged = dedupeMovies(mergeUnique(discovered, manualUpcoming)).sort((a, b) =>
    (a.release_date || "").localeCompare(b.release_date || "")
  );

  return withMovieAssetList(merged.slice(0, limit));
}

export async function getLatestTeluguReleases(limit = DEFAULT_COLLECTION_LIMIT) {
  const today = getIndianTodayIsoDate();

  // Same validated catalog that powers /movies, so the two stay consistent.
  const [validated, manual] = await Promise.all([
    getValidatedTeluguCatalog(),
    getManuallyAddedMovies().catch(() => [] as Movie[]),
  ]);

  // Fold in admin-added movies that have already released.
  const manualReleased = manual.filter(
    (movie) => movie.release_date && movie.release_date <= today
  );

  const merged = sortByReleaseDateDescAndPopularity(
    dedupeMovies(mergeUnique(validated, manualReleased))
  );

  return merged.slice(0, limit);
}

function prioritizeTeluguSearchResults(movies: Movie[]) {
  return [...movies].sort((a, b) => {
    const teluguPriority =
      Number(b.original_language === TELUGU_LANGUAGE) -
      Number(a.original_language === TELUGU_LANGUAGE);

    if (teluguPriority !== 0) {
      return teluguPriority;
    }

    return b.popularity - a.popularity;
  });
}

export async function searchTeluguMovies(
  query: string,
  page = 1
): Promise<PaginatedResponse<Movie>> {
  const response = await searchMovies(query, page);
  const teluguMatches = response.results.filter(
    (movie) => movie.original_language === TELUGU_LANGUAGE
  );
  const ranked = prioritizeTeluguSearchResults(
    teluguMatches.length ? teluguMatches : response.results
  );

  return {
    ...response,
    results: await withMovieAssetList(ranked),
    total_results: teluguMatches.length ? teluguMatches.length : response.total_results,
  };
}

export type TeluguBrowseSort = "popularity" | "newest" | "oldest" | "rating";
export type TeluguBrowseStatus = "all" | "released" | "upcoming";

export interface TeluguBrowseParams {
  sort?: TeluguBrowseSort;
  status?: TeluguBrowseStatus;
  genreId?: string;
  page?: number;
}

export interface TeluguBrowseResult {
  results: Movie[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export const TELUGU_BROWSE_PAGE_SIZE = 30;
const UPCOMING_BROWSE_LIMIT = 100;

/**
 * Loads whatever validated movies are stored for a past year — whether the year
 * is fully frozen or only partially validated — so the catalog grows as the
 * background backfill completes each quarter. Returns [] when nothing is stored
 * yet (or no DB). Never triggers live validation on a user request.
 */
async function loadStoredValidatedYear(year: number): Promise<Movie[]> {
  if (!hasDatabaseConfiguration()) return [];

  try {
    const rows = await listValidatedYearMovieRecords(year);
    return rows
      .map((row) => {
        try {
          return JSON.parse(row.payload) as Movie;
        } catch {
          return null;
        }
      })
      .filter((movie): movie is Movie => Boolean(movie));
  } catch (error) {
    console.warn(
      `[telugu-validation] could not load stored year ${year}.`,
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

export interface ValidationBackfillResult {
  processedQuarters: { year: number; quarter: number; count: number }[];
  frozenYears: number[];
}

/**
 * Resumable background backfill of past years, one quarter at a time. The ONLY
 * place the multi-year validation runs — invoked by the cron, sequential and
 * bounded (`MAX_QUARTERS_PER_RUN` quarters/run) so it never bursts the APIs.
 * Walks newest→oldest, validating each missing quarter, persisting it, and
 * freezing a year once all four quarters are done.
 */
export async function runValidationBackfill(): Promise<ValidationBackfillResult> {
  const processedQuarters: ValidationBackfillResult["processedQuarters"] = [];
  const frozenYears: number[] = [];

  if (!hasDatabaseConfiguration()) return { processedQuarters, frozenYears };

  const currentYear = getIndianCurrentYear();
  let budget = MAX_QUARTERS_PER_RUN;

  for (
    let year = currentYear - 1;
    year >= currentYear - VALIDATED_RELEASE_LOOKBACK_YEARS && budget > 0;
    year -= 1
  ) {
    try {
      if (await isValidatedYearFrozen(year)) continue;

      const done = new Set(
        (await listValidatedYearProgressRecords(year)).map((row) => row.quarter)
      );

      for (let quarter = 1; quarter <= 4 && budget > 0; quarter += 1) {
        if (done.has(quarter)) continue;

        const movies = await validateTeluguQuarter(year, quarter);
        await appendValidatedYearMovies(
          year,
          movies.map((movie) => ({ movieId: movie.id, payload: JSON.stringify(movie) })),
          new Date().toISOString()
        );
        await markValidatedYearQuarter(
          year,
          quarter,
          movies.length,
          new Date().toISOString()
        );
        done.add(quarter);
        processedQuarters.push({ year, quarter, count: movies.length });
        budget -= 1;

        await new Promise((resolve) => setTimeout(resolve, FREEZE_YEAR_DELAY_MS));
      }

      // Freeze the year once every quarter is validated.
      if ([1, 2, 3, 4].every((quarter) => done.has(quarter))) {
        const stored = await listValidatedYearMovieRecords(year);
        await upsertValidatedYearFreeze(year, new Date().toISOString(), stored.length);
        frozenYears.push(year);
      }
    } catch (error) {
      console.warn(
        `[telugu-validation] backfill failed for ${year}; will retry next run.`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return { processedQuarters, frozenYears };
}

/**
 * Full Wikipedia-validated released-movie catalog across the lookback window.
 * Same validation gate as the curated "Recent Releases" feed (a movie appears
 * only if its title is in that year's "List of Telugu films of <year>"), so
 * Movies and Recent Releases stay consistent.
 *
 * Only the CURRENT year is validated live here (cheap: one Wikipedia list + a
 * few discover pages). Past years are read from the DB as the background
 * backfill fills them in quarter by quarter — so no single request ever does
 * the multi-year burst that previously rate-limited (429) the APIs. Cached 6h;
 * the current year is part of the cache key.
 */
const getCachedValidatedTeluguCatalog = unstable_cache(
  async (currentYear: number): Promise<Movie[]> => {
    const releases: Movie[] = [];

    releases.push(...(await getValidatedTeluguReleasesThisYear(currentYear)));

    for (
      let year = currentYear - 1;
      year >= currentYear - VALIDATED_RELEASE_LOOKBACK_YEARS;
      year -= 1
    ) {
      releases.push(...(await loadStoredValidatedYear(year)));
    }

    return sortByReleaseDateDescAndPopularity(dedupeMovies(releases));
  },
  ["validated-telugu-catalog-v4"],
  { revalidate: 21600, tags: [VALIDATED_CATALOG_CACHE_TAG] }
);

export function getValidatedTeluguCatalog(): Promise<Movie[]> {
  return getCachedValidatedTeluguCatalog(getIndianCurrentYear());
}

function movieGenreIds(movie: Movie): number[] {
  if (Array.isArray(movie.genre_ids) && movie.genre_ids.length) {
    return movie.genre_ids;
  }
  // Admin-added movies come from TMDB movie details, which expose `genres`.
  const details = movie as unknown as { genres?: { id: number }[] };
  if (Array.isArray(details.genres)) {
    return details.genres.map((genre) => genre.id);
  }
  return [];
}

function sortBrowseMovies(movies: Movie[], sort: TeluguBrowseSort): Movie[] {
  const copy = [...movies];

  switch (sort) {
    case "newest":
      return copy.sort((a, b) =>
        (b.release_date || "").localeCompare(a.release_date || "")
      );
    case "oldest":
      return copy.sort((a, b) =>
        (a.release_date || "").localeCompare(b.release_date || "")
      );
    case "rating":
      return copy.sort(
        (a, b) => b.vote_average - a.vote_average || b.vote_count - a.vote_count
      );
    case "popularity":
    default:
      return copy.sort((a, b) => b.popularity - a.popularity);
  }
}

/**
 * Paginated "browse all Telugu movies" feed. Released movies come exclusively
 * from the Wikipedia-validated catalog (plus admin-added movies, which always
 * appear regardless of validation). Upcoming movies come from TMDB discover
 * since unreleased films cannot be validated against a Wikipedia release list.
 * Filtering, sorting, and pagination are applied in memory.
 */
export async function browseTeluguMovies({
  sort = "popularity",
  status = "all",
  genreId,
  page = 1,
}: TeluguBrowseParams = {}): Promise<TeluguBrowseResult> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const today = getIndianTodayIsoDate();

  let pool: Movie[] = [];

  if (status === "upcoming") {
    pool = await getUpcomingTeluguMovies(UPCOMING_BROWSE_LIMIT);
  } else {
    const [validated, manual] = await Promise.all([
      getValidatedTeluguCatalog(),
      getManuallyAddedMovies().catch(() => [] as Movie[]),
    ]);
    const manualReleased = manual.filter(
      (movie) => movie.release_date && movie.release_date <= today
    );
    const released = mergeUnique(validated, manualReleased);

    pool =
      status === "released"
        ? released
        : mergeUnique(released, await getUpcomingTeluguMovies(UPCOMING_BROWSE_LIMIT));
  }

  if (genreId && /^\d+$/.test(genreId)) {
    const genreIdNum = Number(genreId);
    pool = pool.filter((movie) => movieGenreIds(movie).includes(genreIdNum));
  }

  const sorted = sortBrowseMovies(pool, sort);

  const totalResults = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / TELUGU_BROWSE_PAGE_SIZE));
  const startIndex = (safePage - 1) * TELUGU_BROWSE_PAGE_SIZE;
  const results = sorted.slice(startIndex, startIndex + TELUGU_BROWSE_PAGE_SIZE);

  return { results, page: safePage, totalPages, totalResults };
}

export async function enrichMovieAssets<T extends Movie>(movie: T) {
  return withMovieAssets(movie);
}

// A detail record missing its poster or release date is treated as sparse.
const DETAIL_FALLBACK_TITLE_SCORE = 0.6;

/**
 * Fetches full movie details, repairing sparse TMDB detail records. Some titles
 * (often brand-new ones) return a near-empty `/movie/{id}` payload — no poster,
 * no release date, language defaulted to "en" — even though TMDB's search index
 * already has the richer Telugu data that fed the card the user clicked. When
 * the detail record is missing its poster or release date, we search by title
 * and merge the best match's fields back in so the detail page renders like the
 * card that linked to it. Falls back to the raw details on any problem.
 */
export async function getMovieDetailsWithFallback(
  id: number
): Promise<MovieDetails> {
  const details = await getMovieDetails(id);

  const isSparse = !details.poster_path || !details.release_date;
  if (!isSparse || !details.title?.trim()) {
    return details;
  }

  try {
    const search = await searchMovies(details.title);
    const candidates = search.results;
    if (!candidates.length) return details;

    // Prefer the exact same movie id (the search index row for this title);
    // otherwise fall back to the closest title match above a safety threshold.
    let match: Movie | undefined = candidates.find((m) => m.id === id);
    if (!match) {
      const best = candidates
        .map((m) => ({
          movie: m,
          score: getTitleSimilarityScore(details.title, m.title),
        }))
        .sort((a, b) => b.score - a.score)[0];
      if (best && best.score >= DETAIL_FALLBACK_TITLE_SCORE) {
        match = best.movie;
      }
    }
    if (!match) return details;

    return {
      ...details,
      poster_path: details.poster_path ?? match.poster_path,
      backdrop_path: details.backdrop_path ?? match.backdrop_path,
      release_date: details.release_date || match.release_date,
      overview: details.overview || match.overview,
      // The details endpoint often defaults language to "en"; trust the search
      // row's language when ours is empty or that suspicious default.
      original_language:
        details.original_language && details.original_language !== "en"
          ? details.original_language
          : match.original_language || details.original_language,
      vote_average: details.vote_average || match.vote_average,
      vote_count: details.vote_count || match.vote_count,
      popularity: details.popularity || match.popularity,
    };
  } catch (error) {
    console.warn(
      `[telugu-movies] detail fallback search failed for ${id}.`,
      error instanceof Error ? error.message : error
    );
    return details;
  }
}

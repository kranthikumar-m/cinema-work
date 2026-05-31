import { cache } from "react";
import {
  discoverMovies,
  getMovieDetails,
  searchMovies,
} from "@/services/tmdb";
import { getIndianCurrentYear, getIndianTodayIsoDate } from "@/lib/date";
import { getTitleSimilarityScore, normalizeMovieTitle } from "@/lib/title-matching";
import { getWikipediaTeluguReleases } from "@/services/wikipedia";
import { getMovieFallbackAssets } from "@/services/google-images";
import { getManuallyAddedMovies, mergeUnique } from "@/services/manual-movies";
import { listTrendingSignalRecords } from "@/lib/database";
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

export interface ExcludedMovieRecord {
  title: string;
  releaseDate: string | null;
  reason: string;
  tmdbId?: number;
  source: "tmdb" | "wikipedia";
}

export interface TeluguReleaseValidationResult {
  confirmedMovies: Movie[];
  excludedMovies: ExcludedMovieRecord[];
  wikipediaPages: string[];
}

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

function hasStrongTeluguSignals(movie: Movie, details: MovieDetails | null) {
  const originalLanguage =
    (details?.original_language || movie.original_language) === TELUGU_LANGUAGE;
  const spokenLanguage =
    details?.spoken_languages.some(
      (language) =>
        language.iso_639_1 === TELUGU_LANGUAGE ||
        /telugu/i.test(language.english_name || language.name)
    ) ?? false;
  const productionInIndia =
    details?.production_countries.some((country) => country.iso_3166_1 === INDIA_REGION) ??
    true;

  return {
    originalLanguage,
    spokenLanguage,
    productionInIndia,
    isStrongTelugu: originalLanguage && (spokenLanguage || productionInIndia),
  };
}

type WikipediaMatchResult =
  | {
      status: "validated";
      matchedBy: MovieValidation["matchedBy"];
      entry: Awaited<ReturnType<typeof getWikipediaTeluguReleases>>["releases"][number];
      score: number;
    }
  | {
      status: "release_date_mismatch";
      matchedBy: MovieValidation["matchedBy"];
      entry: Awaited<ReturnType<typeof getWikipediaTeluguReleases>>["releases"][number];
      score: number;
    }
  | {
      status: "not_found";
    };

function findWikipediaMatch(
  movie: Movie,
  entries: Awaited<ReturnType<typeof getWikipediaTeluguReleases>>["releases"]
): WikipediaMatchResult {
  const normalizedTitle = normalizeMovieTitle(movie.title);
  const exactDateMatches = entries
    .filter((entry) => entry.releaseDate === movie.release_date)
    .map((entry) => ({
      entry,
      score: getTitleSimilarityScore(movie.title, entry.title),
    }))
    .sort((a, b) => b.score - a.score);

  if (exactDateMatches[0] && exactDateMatches[0].score >= 0.74) {
    const matchedBy =
      normalizedTitle === exactDateMatches[0].entry.normalizedTitle ? "exact" : "fuzzy";

    return {
      status: "validated",
      entry: exactDateMatches[0].entry,
      matchedBy,
      score: exactDateMatches[0].score,
    };
  }

  const titleMatches = entries
    .map((entry) => ({
      entry,
      score: getTitleSimilarityScore(movie.title, entry.title),
    }))
    .filter((candidate) => candidate.score >= 0.88)
    .sort((a, b) => b.score - a.score);

  if (titleMatches[0]) {
    return {
      status: "release_date_mismatch",
      entry: titleMatches[0].entry,
      matchedBy:
        normalizedTitle === titleMatches[0].entry.normalizedTitle ? "exact" : "fuzzy",
      score: titleMatches[0].score,
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

export const getValidatedTeluguReleasesThisYear = cache(
  async (year = getIndianCurrentYear()): Promise<TeluguReleaseValidationResult> => {
    const today = getIndianTodayIsoDate();
    const wikipediaDataset = await getWikipediaTeluguReleases(year);
    const tmdbCandidates = await collectDiscoveredTeluguMovies(
      {
        sort_by: "primary_release_date.desc",
        "primary_release_date.gte": `${year}-01-01`,
        "primary_release_date.lte": today,
      },
      { minResults: 100, maxPages: MAX_DISCOVER_PAGES }
    );

    const confirmedMovies: Movie[] = [];
    const excludedMovies: ExcludedMovieRecord[] = [];
    const matchedWikipediaKeys = new Set<string>();

    for (const candidate of tmdbCandidates) {
      if (!candidate.release_date) {
        excludedMovies.push({
          title: candidate.title,
          releaseDate: null,
          reason: "tmdb_missing_release_date",
          tmdbId: candidate.id,
          source: "tmdb",
        });
        continue;
      }

      const wikipediaMatch = findWikipediaMatch(candidate, wikipediaDataset.releases);

      if (wikipediaMatch.status === "not_found") {
        excludedMovies.push({
          title: candidate.title,
          releaseDate: candidate.release_date,
          reason: "no_wikipedia_match",
          tmdbId: candidate.id,
          source: "tmdb",
        });
        continue;
      }

      if (wikipediaMatch.status === "release_date_mismatch") {
        excludedMovies.push({
          title: candidate.title,
          releaseDate: candidate.release_date,
          reason: `release_date_mismatch_vs_wikipedia:${wikipediaMatch.entry.releaseDate}`,
          tmdbId: candidate.id,
          source: "tmdb",
        });
        continue;
      }

      const details = await getMovieDetails(candidate.id).catch(() => null);
      const teluguSignals = hasStrongTeluguSignals(candidate, details);

      if (!teluguSignals.isStrongTelugu) {
        excludedMovies.push({
          title: candidate.title,
          releaseDate: candidate.release_date,
          reason: "weak_telugu_signals_in_tmdb",
          tmdbId: candidate.id,
          source: "tmdb",
        });
        continue;
      }

      matchedWikipediaKeys.add(
        `${wikipediaMatch.entry.normalizedTitle}::${wikipediaMatch.entry.releaseDate}`
      );

      confirmedMovies.push(
        await withMovieAssets({
          ...candidate,
          validation: buildValidation(
            "validated",
            undefined,
            wikipediaMatch.matchedBy,
            wikipediaMatch.entry.title,
            wikipediaMatch.entry.pageTitle,
            wikipediaMatch.entry.releaseDate
          ),
        })
      );
    }

    wikipediaDataset.releases.forEach((entry) => {
      const key = `${entry.normalizedTitle}::${entry.releaseDate}`;

      if (!matchedWikipediaKeys.has(key)) {
        excludedMovies.push({
          title: entry.title,
          releaseDate: entry.releaseDate,
          reason: "wikipedia_release_not_confirmed_in_tmdb",
          source: "wikipedia",
        });
      }
    });

    return {
      confirmedMovies: sortByReleaseDateDescAndPopularity(confirmedMovies),
      excludedMovies,
      wikipediaPages: wikipediaDataset.sourcePages,
    };
  }
);

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
  const currentYear = getIndianCurrentYear();
  const today = getIndianTodayIsoDate();
  const releases: Movie[] = [];

  for (
    let year = currentYear;
    year >= currentYear - VALIDATED_RELEASE_LOOKBACK_YEARS && releases.length < limit;
    year -= 1
  ) {
    const validated = await getValidatedTeluguReleasesThisYear(year);
    releases.push(...validated.confirmedMovies);
  }

  // Fold in admin-added movies that have already released.
  const manual = await getManuallyAddedMovies().catch(() => [] as Movie[]);
  const manualReleased = manual.filter(
    (movie) => movie.release_date && movie.release_date <= today
  );

  const merged = sortByReleaseDateDescAndPopularity(
    dedupeMovies(mergeUnique(releases, manualReleased))
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
const TMDB_PAGE_SIZE = 20;
// TMDB caps discover at 500 pages (~10,000 results).
const TMDB_MAX_RESULTS = TMDB_PAGE_SIZE * 500;

const BROWSE_SORT_MAP: Record<TeluguBrowseSort, string> = {
  popularity: "popularity.desc",
  newest: "primary_release_date.desc",
  oldest: "primary_release_date.asc",
  rating: "vote_average.desc",
};

/**
 * Paginated "browse all Telugu movies" feed backed by TMDB discover. Serves a
 * fixed {@link TELUGU_BROWSE_PAGE_SIZE} per page by fetching the underlying
 * TMDB pages (20 each) that cover the requested window and slicing.
 */
export async function browseTeluguMovies({
  sort = "popularity",
  status = "all",
  genreId,
  page = 1,
}: TeluguBrowseParams = {}): Promise<TeluguBrowseResult> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const today = getIndianTodayIsoDate();

  const params: Record<string, string> = {
    include_adult: "false",
    include_video: "false",
    region: INDIA_REGION,
    with_original_language: TELUGU_LANGUAGE,
    sort_by: BROWSE_SORT_MAP[sort] ?? BROWSE_SORT_MAP.popularity,
  };

  if (status === "released") {
    params["primary_release_date.lte"] = today;
  } else if (status === "upcoming") {
    params["primary_release_date.gte"] = today;
  }

  // Avoid a single high-rated vote dominating the "rating" sort.
  if (sort === "rating") {
    params["vote_count.gte"] = "20";
  }

  if (genreId && /^\d+$/.test(genreId)) {
    params.with_genres = genreId;
  }

  const startIndex = (safePage - 1) * TELUGU_BROWSE_PAGE_SIZE;
  const endIndex = startIndex + TELUGU_BROWSE_PAGE_SIZE;
  const startTmdbPage = Math.floor(startIndex / TMDB_PAGE_SIZE) + 1;
  const endTmdbPage = Math.floor((endIndex - 1) / TMDB_PAGE_SIZE) + 1;

  const collected: Movie[] = [];
  let totalResults = 0;

  for (let tmdbPage = startTmdbPage; tmdbPage <= endTmdbPage; tmdbPage += 1) {
    const response = await discoverMovies(params, tmdbPage);
    totalResults = response.total_results;
    collected.push(...response.results);

    if (tmdbPage >= response.total_pages) break;
  }

  const offsetWithinFirstPage = startIndex - (startTmdbPage - 1) * TMDB_PAGE_SIZE;
  const windowResults = dedupeMovies(collected).slice(
    offsetWithinFirstPage,
    offsetWithinFirstPage + TELUGU_BROWSE_PAGE_SIZE
  );

  const cappedResults = Math.min(totalResults, TMDB_MAX_RESULTS);
  const totalPages = Math.max(1, Math.ceil(cappedResults / TELUGU_BROWSE_PAGE_SIZE));

  return {
    results: await withMovieAssetList(windowResults),
    page: safePage,
    totalPages,
    totalResults: cappedResults,
  };
}

export async function enrichMovieAssets<T extends Movie>(movie: T) {
  return withMovieAssets(movie);
}

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

  return [...deduped.values()];
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

export async function getTeluguTrendingMovies(limit = DEFAULT_COLLECTION_LIMIT) {
  const validated = await getValidatedTeluguReleasesThisYear();
  const discovered = await collectDiscoveredTeluguMovies(
    {
      sort_by: "popularity.desc",
      "primary_release_date.lte": getIndianTodayIsoDate(),
      "vote_count.gte": "10",
    },
    { minResults: limit * 2 }
  );

  const merged = dedupeMovies([
    ...sortByPopularity(validated.confirmedMovies),
    ...sortByPopularity(discovered),
  ]).slice(0, limit);

  return withMovieAssetList(merged);
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
  const movies = await collectDiscoveredTeluguMovies(
    {
      sort_by: "primary_release_date.asc",
      "primary_release_date.gte": today,
    },
    { minResults: limit * 2 }
  );

  return withMovieAssetList(movies.slice(0, limit));
}

export async function getLatestTeluguReleases(limit = DEFAULT_COLLECTION_LIMIT) {
  const validated = await getValidatedTeluguReleasesThisYear();
  return validated.confirmedMovies.slice(0, limit);
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

export async function enrichMovieAssets<T extends Movie>(movie: T) {
  return withMovieAssets(movie);
}

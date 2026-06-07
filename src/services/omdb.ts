import { cache } from "react";
import { unstable_cache } from "next/cache";
import { env } from "@/lib/env";
import { getMovieExternalIds } from "@/services/tmdb";
import { getTitleSimilarityScore } from "@/lib/title-matching";
import type { Movie } from "@/types/tmdb";

/**
 * IMDb ratings shown across the UI, sourced with a hybrid strategy:
 *
 *  1. OMDb API (omdbapi.com, OMDB_API_KEY) — the sanctioned source for the score.
 *     IMDb ids for list items (which carry only a TMDB id) come from TMDB's
 *     external_ids, so cards resolve the same id the detail page uses.
 *  2. IMDb (FALLBACK, only when OMDb has no rating). OMDb mirrors IMDb on a lag,
 *     so freshly-rated titles return N/A from OMDb even though IMDb shows a
 *     score. When TMDB and OMDb both lack the IMDb id, IMDb's suggestion (search)
 *     API resolves it from the title, then IMDb's GraphQL returns the live
 *     aggregateRating. Note: IMDb's API response states its data is not licensed
 *     for public/commercial use; this fallback is enabled per the project
 *     owner's decision and should be revisited before any commercial deployment.
 *
 * Lookups are cached 24h and deduped within a request. Year is intentionally NOT
 * sent to OMDb — TMDB and IMDb frequently disagree on a Telugu film's year, and
 * a hard year filter produces false "not found" misses. Without an OMDB_API_KEY,
 * OMDb calls no-op (no network); the IMDb fallback still works when an id exists.
 */

const OMDB_BASE_URL = "https://www.omdbapi.com/";
const IMDB_GRAPHQL_URL = "https://api.graphql.imdb.com/";
const IMDB_SUGGESTION_URL = "https://v3.sg.media-imdb.com/suggestion/x/";
const RATING_CACHE_SECONDS = 86400; // 24h
const IMDB_LOOKUP_CONCURRENCY = 8;
// Min title similarity to trust a suggestion-API id match (avoids wrong films).
const SUGGESTION_MIN_SCORE = 0.7;
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface ImdbRating {
  rating: number | null;
  votes: number | null;
}

const NO_RATING: ImdbRating = { rating: null, votes: null };

export interface ImdbCompanyCredit {
  name: string;
  detail: string | null;
}

export interface ImdbTitleExtras {
  color: string | null;
  soundMixes: string[];
  aspectRatios: string[];
  cameras: string[];
  negativeFormats: string[];
  cinematographicProcesses: string[];
  printedFormats: string[];
  productionCompanies: ImdbCompanyCredit[];
  distributors: ImdbCompanyCredit[];
  otherCompanies: ImdbCompanyCredit[];
}

const NO_TITLE_EXTRAS: ImdbTitleExtras = {
  color: null,
  soundMixes: [],
  aspectRatios: [],
  cameras: [],
  negativeFormats: [],
  cinematographicProcesses: [],
  printedFormats: [],
  productionCompanies: [],
  distributors: [],
  otherCompanies: [],
};

export interface ImdbCastCredit {
  id: string; // IMDb name id ("nm…")
  name: string;
  imageUrl: string | null;
  characters: string[];
}

export interface ImdbCrewCredit {
  id: string;
  name: string;
  imageUrl: string | null;
  categoryId: string;
  categoryLabel: string;
  jobs: string[];
}

export interface ImdbFullCredits {
  cast: ImdbCastCredit[];
  crew: ImdbCrewCredit[];
}

const NO_FULL_CREDITS: ImdbFullCredits = { cast: [], crew: [] };

interface OmdbLookup extends ImdbRating {
  imdbId: string | null;
}

const NO_OMDB: OmdbLookup = { rating: null, votes: null, imdbId: null };

function parseRating(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseVotes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function omdbRequest(params: Record<string, string>): Promise<OmdbLookup> {
  const apiKey = env.OMDB_API_KEY;
  if (!apiKey) return NO_OMDB;

  const url = new URL(OMDB_BASE_URL);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("r", "json");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  try {
    const res = await fetch(url.toString(), { next: { revalidate: RATING_CACHE_SECONDS } });
    if (!res.ok) return NO_OMDB;

    const data = (await res.json()) as {
      Response?: string;
      imdbRating?: string;
      imdbVotes?: string;
      imdbID?: string;
    };
    if (data?.Response === "False") return NO_OMDB;

    return {
      rating: parseRating(data?.imdbRating),
      votes: parseVotes(data?.imdbVotes),
      imdbId: typeof data?.imdbID === "string" ? data.imdbID : null,
    };
  } catch {
    return NO_OMDB;
  }
}

// OMDb by IMDb id (exact) / by title (no year — see header note).
const omdbByImdbId = cache((imdbId: string) => omdbRequest({ i: imdbId }));
const omdbByTitle = cache((title: string) => omdbRequest({ t: title, type: "movie" }));

// IMDb live rating, used only as a fallback. Cached across requests.
const fetchImdbGraphqlRating = unstable_cache(
  async (imdbId: string): Promise<ImdbRating> => {
    if (!imdbId) return NO_RATING;

    const query = `query{title(id:"${imdbId}"){ratingsSummary{aggregateRating voteCount}}}`;
    try {
      const res = await fetch(IMDB_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": BROWSER_USER_AGENT,
        },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) return NO_RATING;

      const data = (await res.json()) as {
        data?: {
          title?: { ratingsSummary?: { aggregateRating?: number; voteCount?: number } };
        };
      };
      const summary = data?.data?.title?.ratingsSummary;
      const rating =
        typeof summary?.aggregateRating === "number" && summary.aggregateRating > 0
          ? summary.aggregateRating
          : null;
      const votes = typeof summary?.voteCount === "number" ? summary.voteCount : null;
      return { rating, votes: rating ? votes : null };
    } catch {
      return NO_RATING;
    }
  },
  ["imdb-graphql-rating"],
  { revalidate: RATING_CACHE_SECONDS }
);

function dedupeStrings(values: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const v = value?.trim();
    if (!v || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
  }
  return out;
}

interface ImdbCompanyNode {
  company?: { companyText?: { text?: string } };
  category?: { text?: string };
  countries?: { text?: string }[] | null;
  attributes?: { text?: string }[] | null;
}

// Builds "India · theatrical" style detail from a company credit's countries +
// attributes (medium). Returns null when there's nothing extra to show.
function companyDetail(node: ImdbCompanyNode): string | null {
  const countries = dedupeStrings((node.countries ?? []).map((c) => c.text));
  const mediums = dedupeStrings((node.attributes ?? []).map((a) => a.text));
  const parts = [...countries, ...mediums];
  return parts.length ? parts.join(" · ") : null;
}

function dedupeCompanies(list: ImdbCompanyCredit[]): ImdbCompanyCredit[] {
  const seen = new Set<string>();
  const out: ImdbCompanyCredit[] = [];
  for (const c of list) {
    const key = `${c.name}|${c.detail ?? ""}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/**
 * IMDb-exclusive title extras via IMDb's GraphQL — technical specs (colour,
 * sound, aspect, camera, formats, process) plus distributor and other-company
 * credits, which TMDB doesn't carry. Same source/caveat as the rating lookup:
 * IMDb's API ToS restricts commercial/public reuse, so treat as best-effort.
 */
const fetchImdbTitleExtras = unstable_cache(
  async (imdbId: string): Promise<ImdbTitleExtras> => {
    if (!imdbId) return NO_TITLE_EXTRAS;

    const query = `query{title(id:"${imdbId}"){technicalSpecifications{soundMixes{items{text}} aspectRatios{items{aspectRatio}} colorations{items{text}} cameras{items{camera}} negativeFormats{items{negativeFormat}} processes{items{process}} printedFormats{items{printedFormat}}} companyCredits(first:80){edges{node{company{companyText{text}} category{text} countries{text} attributes{text}}}}}}`;
    try {
      const res = await fetch(IMDB_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": BROWSER_USER_AGENT,
        },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) return NO_TITLE_EXTRAS;

      const data = (await res.json()) as {
        data?: {
          title?: {
            technicalSpecifications?: {
              soundMixes?: { items?: { text?: string }[] };
              aspectRatios?: { items?: { aspectRatio?: string }[] };
              colorations?: { items?: { text?: string }[] };
              cameras?: { items?: { camera?: string }[] };
              negativeFormats?: { items?: { negativeFormat?: string }[] };
              processes?: { items?: { process?: string }[] };
              printedFormats?: { items?: { printedFormat?: string }[] };
            };
            companyCredits?: { edges?: { node?: ImdbCompanyNode }[] };
          };
        };
      };
      const title = data?.data?.title;
      const tech = title?.technicalSpecifications;
      const colorations = dedupeStrings((tech?.colorations?.items ?? []).map((i) => i.text));

      const productionCompanies: ImdbCompanyCredit[] = [];
      const distributors: ImdbCompanyCredit[] = [];
      const otherCompanies: ImdbCompanyCredit[] = [];
      for (const edge of title?.companyCredits?.edges ?? []) {
        const node = edge.node;
        const name = node?.company?.companyText?.text?.trim();
        if (!name) continue;
        const category = node?.category?.text ?? "";
        if (/production/i.test(category)) {
          productionCompanies.push({ name, detail: null });
        } else if (/distributor/i.test(category)) {
          distributors.push({ name, detail: companyDetail(node!) });
        } else if (/other/i.test(category)) {
          // IMDb's "Other Companies" section (music labels etc.) — not the
          // separate "Special Effects" / "Production Companies" buckets.
          const mediums = dedupeStrings((node!.attributes ?? []).map((a) => a.text));
          otherCompanies.push({ name, detail: mediums.join(" · ") || null });
        }
      }

      return {
        color: colorations[0] ?? null,
        soundMixes: dedupeStrings((tech?.soundMixes?.items ?? []).map((i) => i.text)),
        aspectRatios: dedupeStrings((tech?.aspectRatios?.items ?? []).map((i) => i.aspectRatio)),
        cameras: dedupeStrings((tech?.cameras?.items ?? []).map((i) => i.camera)),
        negativeFormats: dedupeStrings(
          (tech?.negativeFormats?.items ?? []).map((i) => i.negativeFormat)
        ),
        cinematographicProcesses: dedupeStrings(
          (tech?.processes?.items ?? []).map((i) => i.process)
        ),
        printedFormats: dedupeStrings(
          (tech?.printedFormats?.items ?? []).map((i) => i.printedFormat)
        ),
        productionCompanies: dedupeCompanies(productionCompanies).slice(0, 14),
        distributors: dedupeCompanies(distributors).slice(0, 14),
        otherCompanies: dedupeCompanies(otherCompanies).slice(0, 12),
      };
    } catch {
      return NO_TITLE_EXTRAS;
    }
  },
  ["imdb-graphql-title-extras"],
  { revalidate: RATING_CACHE_SECONDS }
);

export function getImdbTitleExtras(
  imdbId: string | null | undefined
): Promise<ImdbTitleExtras> {
  if (!imdbId) return Promise.resolve(NO_TITLE_EXTRAS);
  return fetchImdbTitleExtras(imdbId);
}

// How many credits to pull from IMDb. The connection returns them in IMDb's
// display order (cast in billing order first, then crew by department), so this
// covers the full cast plus the meaningful crew without the extreme long tail.
const IMDB_CREDITS_FETCH_COUNT = 220;

/**
 * Full cast & crew straight from IMDb's GraphQL `credits` connection, preserving
 * IMDb's own display order — cast in billing order with characters + headshots,
 * then crew grouped by department (Director, Writer, Producer, Composer,
 * Cinematographer, Editor, …). Cast vs crew is told apart by the presence of
 * `characters` (only Cast nodes carry it). Same source/caveat as the other IMDb
 * lookups: IMDb's API ToS restricts reuse, so treat as best-effort.
 */
const fetchImdbFullCredits = unstable_cache(
  async (imdbId: string): Promise<ImdbFullCredits> => {
    if (!imdbId) return NO_FULL_CREDITS;

    const query = `query{title(id:"${imdbId}"){credits(first:${IMDB_CREDITS_FETCH_COUNT}){edges{node{category{id text} name{id nameText{text} primaryImage{url}} ... on Cast{characters{name}} ... on Crew{jobs{text}}}}}}}`;
    try {
      const res = await fetch(IMDB_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": BROWSER_USER_AGENT,
        },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) return NO_FULL_CREDITS;

      const data = (await res.json()) as {
        data?: {
          title?: {
            credits?: {
              edges?: {
                node?: {
                  category?: { id?: string; text?: string };
                  name?: {
                    id?: string;
                    nameText?: { text?: string };
                    primaryImage?: { url?: string };
                  };
                  characters?: { name?: string }[];
                  jobs?: { text?: string }[];
                };
              }[];
            };
          };
        };
      };

      const edges = data?.data?.title?.credits?.edges ?? [];
      // Maps preserve insertion (= IMDb) order while deduping repeat credits.
      const castMap = new Map<string, ImdbCastCredit>();
      const crewMap = new Map<string, ImdbCrewCredit>();

      for (const edge of edges) {
        const node = edge?.node;
        const name = node?.name?.nameText?.text?.trim();
        if (!node || !name) continue;
        const id = node.name?.id ?? "";
        const imageUrl = node.name?.primaryImage?.url ?? null;

        const categoryId = node.category?.id ?? "";
        // A cast credit either carries a `characters` array or sits in a cast
        // category (actor/actress/self/voice) — actors with no listed character
        // return `characters: null`, so the category check keeps them in Cast.
        const isCast =
          Array.isArray(node.characters) || /^(actor|actress|self|voice)/i.test(categoryId);

        if (isCast) {
          const characters = (node.characters ?? [])
            .map((c) => c?.name?.trim())
            .filter((c): c is string => Boolean(c));
          const key = id || name;
          const existing = castMap.get(key);
          if (existing) {
            for (const ch of characters) {
              if (!existing.characters.includes(ch)) existing.characters.push(ch);
            }
          } else {
            castMap.set(key, { id, name, imageUrl, characters });
          }
        } else {
          const categoryLabel = node.category?.text ?? "";
          const jobs = (node.jobs ?? [])
            .map((j) => j?.text?.trim())
            .filter((j): j is string => Boolean(j));
          const key = `${id || name}:${categoryId}`;
          const existing = crewMap.get(key);
          if (existing) {
            for (const job of jobs) {
              if (!existing.jobs.includes(job)) existing.jobs.push(job);
            }
          } else {
            crewMap.set(key, { id, name, imageUrl, categoryId, categoryLabel, jobs });
          }
        }
      }

      return { cast: Array.from(castMap.values()), crew: Array.from(crewMap.values()) };
    } catch {
      return NO_FULL_CREDITS;
    }
  },
  ["imdb-full-credits"],
  { revalidate: RATING_CACHE_SECONDS }
);

export function getImdbFullCredits(
  imdbId: string | null | undefined
): Promise<ImdbFullCredits> {
  if (!imdbId) return Promise.resolve(NO_FULL_CREDITS);
  return fetchImdbFullCredits(imdbId);
}

function extractYear(dateString: string | undefined): number | null {
  const year = Number.parseInt((dateString ?? "").slice(0, 4), 10);
  return Number.isFinite(year) && year > 1900 ? year : null;
}

// List/card movies carry a TMDB id but no imdb_id. Fetching the id from TMDB's
// external_ids gives the SAME accurate id the detail page uses, avoiding wrong
// matches for ambiguous titles (e.g. the many films named "Biker").
const getTmdbImdbId = cache(async (tmdbId: number): Promise<string | null> => {
  try {
    const external = await getMovieExternalIds(tmdbId);
    return external?.imdb_id || null;
  } catch {
    return null;
  }
});

// Resolve an IMDb id from a title using IMDb's own suggestion (search) API —
// the last resort when both TMDB and OMDb lack the id. Picks the closest title
// match (year used as a tie-breaker) above SUGGESTION_MIN_SCORE.
const resolveImdbIdViaSuggestion = unstable_cache(
  async (title: string, year: number | null): Promise<string | null> => {
    if (!title) return null;

    try {
      const res = await fetch(
        `${IMDB_SUGGESTION_URL}${encodeURIComponent(title)}.json?includeVideos=0`,
        { headers: { "User-Agent": BROWSER_USER_AGENT } }
      );
      if (!res.ok) return null;

      const data = (await res.json()) as {
        d?: Array<{ id?: string; l?: string; y?: number }>;
      };
      const items = Array.isArray(data?.d) ? data.d : [];

      let bestId: string | null = null;
      let bestScore = 0;
      for (const item of items) {
        const id = item?.id;
        const label = item?.l;
        if (typeof id !== "string" || !id.startsWith("tt")) continue;
        if (typeof label !== "string" || !label) continue;

        let score = getTitleSimilarityScore(title, label);
        if (year && typeof item?.y === "number" && Math.abs(item.y - year) <= 1) {
          score += 0.1;
        }
        if (score > bestScore) {
          bestScore = score;
          bestId = id;
        }
      }

      return bestScore >= SUGGESTION_MIN_SCORE ? bestId : null;
    } catch {
      return null;
    }
  },
  ["imdb-suggestion-id"],
  { revalidate: RATING_CACHE_SECONDS }
);

/**
 * Resolves an IMDb id ("tt…") from a film title via IMDb's suggestion API.
 * Used to bridge a non-TMDB-discovered title to TMDB (via /find?imdb_id).
 */
export function resolveImdbIdFromTitle(
  title: string,
  year: number | null
): Promise<string | null> {
  return resolveImdbIdViaSuggestion(title, year);
}

async function resolveImdbRating(movie: Movie): Promise<ImdbRating> {
  const title = movie.title?.trim();
  let imdbId = (movie as { imdb_id?: string | null }).imdb_id ?? null;

  // No imdb_id on the object (list/card items) → get the accurate one from TMDB.
  if (!imdbId && movie.id) {
    imdbId = await getTmdbImdbId(movie.id);
  }

  // OMDb first. For items still without an id, OMDb-by-title also resolves the
  // id we need for the IMDb fallback.
  let omdb: OmdbLookup = NO_OMDB;
  if (imdbId) {
    omdb = await omdbByImdbId(imdbId);
  } else if (title) {
    omdb = await omdbByTitle(title);
    imdbId = omdb.imdbId;
  }
  if (omdb.rating) return { rating: omdb.rating, votes: omdb.votes };

  // Neither TMDB nor OMDb knew the IMDb id — resolve it via IMDb's own search.
  if (!imdbId && title) {
    imdbId = await resolveImdbIdViaSuggestion(title, extractYear(movie.release_date));
  }

  // OMDb has no rating yet → use IMDb's live figure when we have an id.
  if (imdbId) {
    const live = await fetchImdbGraphqlRating(imdbId);
    if (live.rating) return live;
  }

  return NO_RATING;
}

/** Attaches the IMDb rating/votes to a single movie. */
export async function attachImdbRating<T extends Movie>(movie: T): Promise<T> {
  const { rating, votes } = await resolveImdbRating(movie);
  return { ...movie, imdb_rating: rating, imdb_votes: votes } as T;
}

/** Attaches IMDb ratings to a list of movies with bounded concurrency. */
export async function attachImdbRatings<T extends Movie>(movies: T[]): Promise<T[]> {
  if (!movies.length) return movies;

  const out: T[] = new Array(movies.length);
  let cursor = 0;

  async function worker() {
    while (cursor < movies.length) {
      const index = cursor;
      cursor += 1;
      const { rating, votes } = await resolveImdbRating(movies[index]);
      out[index] = { ...movies[index], imdb_rating: rating, imdb_votes: votes } as T;
    }
  }

  const workerCount = Math.min(IMDB_LOOKUP_CONCURRENCY, movies.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return out;
}

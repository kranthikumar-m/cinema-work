import { cache } from "react";
import { getIndianCurrentYear, getIndianTodayIsoDate, isIsoDateOnOrBefore } from "@/lib/date";
import { normalizeMovieTitle } from "@/lib/title-matching";

const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";
const RELEASE_TABLE_REGEX = /<table class="wikitable sortable"[^>]*>([\s\S]*?)<\/table>/gi;
const ROW_REGEX = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
const CELL_REGEX = /<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
const STRIP_SUP_REGEX = /<sup\b[^>]*>[\s\S]*?<\/sup>/gi;
const STRIP_TAG_REGEX = /<[^>]+>/g;
const MONTHS = new Map<string, string>([
  ["JANUARY", "01"],
  ["FEBRUARY", "02"],
  ["MARCH", "03"],
  ["APRIL", "04"],
  ["MAY", "05"],
  ["JUNE", "06"],
  ["JULY", "07"],
  ["AUGUST", "08"],
  ["SEPTEMBER", "09"],
  ["OCTOBER", "10"],
  ["NOVEMBER", "11"],
  ["DECEMBER", "12"],
]);

interface WikipediaSearchResponse {
  query?: {
    search?: Array<{
      title: string;
    }>;
  };
}

interface WikipediaParseResponse {
  parse?: {
    title: string;
    text: string;
  };
}

interface ParsedCell {
  html: string;
  text: string;
  rowspan: number;
}

export interface WikipediaReleaseEntry {
  title: string;
  normalizedTitle: string;
  releaseDate: string;
  pageTitle: string;
  pageUrl: string;
  moviePageUrl: string | null;
}

export interface WikipediaReleaseDataset {
  year: number;
  sourcePages: string[];
  releases: WikipediaReleaseEntry[];
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    nbsp: " ",
    quot: '"',
    ndash: "-",
    mdash: "-",
    rsquo: "'",
    lsquo: "'",
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16))
    )
    .replace(/&([a-z]+);/gi, (_, entity) => namedEntities[entity] ?? "");
}

function cleanHtmlText(value: string) {
  return decodeHtmlEntities(
    value
      .replace(STRIP_SUP_REGEX, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(STRIP_TAG_REGEX, " ")
      .replace(/\[[^\]]+\]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function extractCells(rowHtml: string) {
  return Array.from(rowHtml.matchAll(CELL_REGEX)).map((match) => {
    const [, , attributes, innerHtml] = match;
    const rowspan = Number(attributes.match(/rowspan="(\d+)"/i)?.[1] ?? "1");

    return {
      html: innerHtml,
      text: cleanHtmlText(innerHtml),
      rowspan,
    } satisfies ParsedCell;
  });
}

function getMonthKey(value: string) {
  return value.replace(/[^A-Za-z]/g, "").toUpperCase();
}

function isMonthCell(value: string) {
  return MONTHS.has(getMonthKey(value));
}

function parseDay(value: string) {
  const normalized = value.trim();

  if (!/^\d{1,2}$/.test(normalized)) {
    return null;
  }

  return normalized.padStart(2, "0");
}

function buildWikipediaUrl(title: string) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`;
}

function parseMoviePageUrl(cellHtml: string) {
  const href = cellHtml.match(/href="([^"]+)"/i)?.[1];

  if (!href?.startsWith("/wiki/")) {
    return null;
  }

  return `https://en.wikipedia.org${href}`;
}

// Parses every dated entry (released AND upcoming) from a year's tables. The
// released/upcoming split is applied by the public getters below, so a single
// cached fetch+parse serves both the Latest catalog and the Upcoming section.
function parseReleaseTables(html: string, pageTitle: string, year: number) {
  const releases: WikipediaReleaseEntry[] = [];
  const tableMatches = Array.from(html.matchAll(RELEASE_TABLE_REGEX));

  for (let tableIndex = 0; tableIndex < tableMatches.length; tableIndex += 1) {
    const tableMatch = tableMatches[tableIndex];
    const tableHtml = tableMatch[1];

    if (!/Opening/i.test(tableHtml) || !/Title/i.test(tableHtml)) {
      continue;
    }

    let currentMonth: string | null = null;
    let currentDay: string | null = null;
    const rowMatches = Array.from(tableHtml.matchAll(ROW_REGEX));

    for (let rowIndex = 0; rowIndex < rowMatches.length; rowIndex += 1) {
      const rowMatch = rowMatches[rowIndex];
      const cells = extractCells(rowMatch[1]);

      if (!cells.length) continue;
      if (cells.some((cell) => /^Opening$/i.test(cell.text))) continue;

      let cursor = 0;

      if (cells[cursor] && isMonthCell(cells[cursor].text)) {
        currentMonth = MONTHS.get(getMonthKey(cells[cursor].text)) ?? null;
        cursor += 1;
      }

      if (cells[cursor]) {
        const parsedDay = parseDay(cells[cursor].text);

        if (parsedDay || /^[\u2013\u2014-]+$/.test(cells[cursor].text)) {
          currentDay = parsedDay;
          cursor += 1;
        }
      }

      if (!currentMonth || !currentDay || !cells[cursor]) {
        continue;
      }

      const title = cells[cursor].text;

      if (!title) {
        continue;
      }

      const releaseDate = `${year}-${currentMonth}-${currentDay}`;

      releases.push({
        title,
        normalizedTitle: normalizeMovieTitle(title),
        releaseDate,
        pageTitle,
        pageUrl: buildWikipediaUrl(pageTitle),
        moviePageUrl: parseMoviePageUrl(cells[cursor].html),
      });
    }
  }

  return releases;
}

const WIKIPEDIA_HEADERS = {
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (compatible; TeluguCinemaUpdatesBot/1.0; +https://example.com)",
};
const WIKIPEDIA_MAX_RETRIES = 3;

/**
 * Fetches a Wikipedia URL, retrying transient rate-limits (429) and server
 * blips (503) with backoff that honors any Retry-After header. Returns the final
 * Response either way — callers decide how to treat a non-OK status.
 */
async function wikipediaFetch(url: string): Promise<Response> {
  let response = await fetch(url, { headers: WIKIPEDIA_HEADERS, next: { revalidate: 21600 } });

  for (let attempt = 0; attempt < WIKIPEDIA_MAX_RETRIES; attempt += 1) {
    if (response.ok || (response.status !== 429 && response.status !== 503)) {
      return response;
    }

    const retryAfter = Number(response.headers.get("retry-after"));
    const delayMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 5000)
        : 400 * 2 ** attempt; // 400ms, 800ms, 1600ms

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    response = await fetch(url, { headers: WIKIPEDIA_HEADERS, next: { revalidate: 21600 } });
  }

  return response;
}

async function wikipediaFetchJson<T>(params: Record<string, string>) {
  const url = new URL(WIKIPEDIA_API_URL);

  Object.entries({
    action: "query",
    format: "json",
    formatversion: "2",
    origin: "*",
    ...params,
  }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await wikipediaFetch(url.toString());

  if (!response.ok) {
    throw new Error(`Wikipedia request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function searchWikipediaPageTitles(year: number) {
  const response = await wikipediaFetchJson<WikipediaSearchResponse>({
    list: "search",
    srsearch: `${year} Telugu films`,
  });

  const discoveredTitles =
    response.query?.search
      ?.map((result) => result.title)
      ?.filter((title) => /Telugu/i.test(title) && /(films|cinema)/i.test(title)) ?? [];

  const titleSet = new Set<string>([
    `List of Telugu films of ${year}`,
    `${year} in Telugu cinema`,
    ...discoveredTitles,
  ]);

  return Array.from(titleSet);
}

async function fetchWikipediaPageHtml(title: string) {
  const url = new URL(WIKIPEDIA_API_URL);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", title);
  url.searchParams.set("prop", "text");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("origin", "*");

  const response = await wikipediaFetch(url.toString());

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as WikipediaParseResponse & {
    error?: { info?: string };
  };

  if (payload.error || !payload.parse?.text) {
    return null;
  }

  return payload.parse;
}

// One cached fetch+parse per year, returning ALL dated entries (released and
// upcoming). The released/upcoming getters below filter this shared dataset.
const getAllWikipediaTeluguEntries = cache(
  async (year = getIndianCurrentYear()): Promise<WikipediaReleaseDataset> => {
    try {
      const pageTitles = await searchWikipediaPageTitles(year);
      const releases: WikipediaReleaseEntry[] = [];
      const sourcePages: string[] = [];

      for (const title of pageTitles) {
        const page = await fetchWikipediaPageHtml(title);

        if (!page) {
          continue;
        }

        const pageReleases = parseReleaseTables(page.text, page.title, year);

        if (!pageReleases.length) {
          continue;
        }

        sourcePages.push(page.title);
        releases.push(...pageReleases);
      }

      const deduped = new Map<string, WikipediaReleaseEntry>();

      releases.forEach((entry) => {
        deduped.set(`${entry.normalizedTitle}::${entry.releaseDate}`, entry);
      });

      return {
        year,
        sourcePages,
        releases: Array.from(deduped.values()).sort((a, b) =>
          a.releaseDate.localeCompare(b.releaseDate)
        ),
      };
    } catch (error) {
      // Wikipedia is a validation source, not a hard dependency. If it stays
      // unreachable (e.g. a persistent 429) after retries, degrade to an empty
      // dataset so the catalog/upcoming code falls back gracefully instead of
      // crashing the page — matching how the other scrapers fail soft.
      console.warn(
        `[wikipedia] could not load Telugu releases for ${year}; continuing without them.`,
        error instanceof Error ? error.message : error
      );
      return { year, sourcePages: [], releases: [] };
    }
  }
);

/**
 * Telugu films from a year's Wikipedia list that have ALREADY released
 * (on/before today). Used to validate the Latest catalog.
 */
export const getWikipediaTeluguReleases = cache(
  async (year = getIndianCurrentYear()): Promise<WikipediaReleaseDataset> => {
    const dataset = await getAllWikipediaTeluguEntries(year);
    const today = getIndianTodayIsoDate();
    return {
      ...dataset,
      releases: dataset.releases.filter((entry) =>
        isIsoDateOnOrBefore(entry.releaseDate, today)
      ),
    };
  }
);

/**
 * Telugu films from a year's Wikipedia list that are scheduled to release AFTER
 * today. Used to validate the Upcoming section the same way Latest is validated.
 */
export const getUpcomingWikipediaTeluguReleases = cache(
  async (year = getIndianCurrentYear()): Promise<WikipediaReleaseDataset> => {
    const dataset = await getAllWikipediaTeluguEntries(year);
    const today = getIndianTodayIsoDate();
    return {
      ...dataset,
      releases: dataset.releases.filter(
        (entry) => !isIsoDateOnOrBefore(entry.releaseDate, today)
      ),
    };
  }
);

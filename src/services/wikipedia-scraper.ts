/**
 * Wikipedia Scraper for Telugu Film Releases
 *
 * Scrapes the "List of Telugu films of <year>" Wikipedia page
 * to extract movie titles and release dates.
 *
 * Wikipedia page structure (typical):
 *   https://en.wikipedia.org/wiki/List_of_Telugu_films_of_2026
 *   Contains tables with columns: #, Title, Director, Cast, Release date, etc.
 *
 * Parsing strategy:
 *   - Fetch the page HTML via the Wikipedia REST API (parsed HTML)
 *   - Extract all wikitables
 *   - Look for tables that have "Title" and date-like columns
 *   - Parse each row for title and release date
 */

export interface WikipediaTeluguMovie {
  title: string;
  releaseDate: string | null;
  /** Cleaned/normalized title for matching */
  normalizedTitle: string;
}

/**
 * Normalize a movie title for fuzzy matching.
 * Handles: lowercase, remove punctuation, collapse whitespace,
 * handle transliteration differences (common Telugu title patterns).
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[''ʼ`]/g, "") // Remove various apostrophes
    .replace(/[:\-–—.,!?()[\]{}""\"]/g, " ") // Punctuation to space
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/^the\s+/i, "") // Remove leading "The"
    .trim();
}

/**
 * Parse a date string from Wikipedia (varies in format).
 * Common formats: "15 March", "March 15, 2026", "15 March 2026", "TBA"
 */
function parseWikiDate(dateStr: string, year: number): string | null {
  if (!dateStr || /tba|tbd|upcoming|unreleased/i.test(dateStr)) {
    return null;
  }

  // Clean the date string
  const cleaned = dateStr.replace(/\[\d+\]/g, "").replace(/\(.*?\)/g, "").trim();

  // Try parsing with the year appended if not present
  const withYear = cleaned.includes(String(year)) ? cleaned : `${cleaned} ${year}`;
  const parsed = new Date(withYear);

  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

/**
 * Fetch and parse the Wikipedia "List of Telugu films of <year>" page.
 * Uses the Wikipedia API to get parsed HTML, then extracts tables.
 */
export async function scrapeTeluguFilmsFromWikipedia(
  year: number
): Promise<WikipediaTeluguMovie[]> {
  const pageTitle = `List_of_Telugu_films_of_${year}`;
  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${pageTitle}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "TCU-TeluguCinemaUpdates/1.0 (cinema-updates-bot)",
        Accept: "text/html",
      },
      next: { revalidate: 86400 }, // Cache for 24h
    });

    if (!res.ok) {
      console.error(
        `[Wikipedia] Failed to fetch page: ${res.status} ${res.statusText}`
      );
      return [];
    }

    const html = await res.text();
    return parseWikipediaHTML(html, year);
  } catch (error) {
    console.error("[Wikipedia] Scraping failed:", error);
    return [];
  }
}

/**
 * Parse the Wikipedia HTML to extract Telugu movie titles and release dates.
 * Looks for wikitables and extracts rows with title + date columns.
 */
function parseWikipediaHTML(
  html: string,
  year: number
): WikipediaTeluguMovie[] {
  const movies: WikipediaTeluguMovie[] = [];
  const seenTitles = new Set<string>();

  // Match all wikitable/sortable tables
  const tableRegex = /<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[1];

    // Extract header row to find column indices
    const headerMatch = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
    if (!headerMatch) continue;

    const headers = extractCellTexts(headerMatch[1], true);
    const titleIdx = headers.findIndex((h) =>
      /^(title|film|movie)/i.test(h.trim())
    );
    const dateIdx = headers.findIndex((h) =>
      /release|date/i.test(h.trim())
    );

    if (titleIdx === -1) continue; // Skip tables without a title column

    // Extract data rows
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    let isFirst = true;

    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      // Skip header row
      if (isFirst) {
        isFirst = false;
        continue;
      }

      const cells = extractCellTexts(rowMatch[1], false);
      if (cells.length <= titleIdx) continue;

      const rawTitle = cells[titleIdx]?.trim();
      if (!rawTitle || rawTitle.length < 2) continue;

      const rawDate = dateIdx >= 0 && cells.length > dateIdx ? cells[dateIdx] : null;
      const releaseDate = rawDate ? parseWikiDate(rawDate, year) : null;
      const normalizedTitle = normalizeTitle(rawTitle);

      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        movies.push({
          title: rawTitle,
          releaseDate,
          normalizedTitle,
        });
      }
    }
  }

  return movies;
}

/**
 * Extract text content from table cells (<th> or <td>).
 * Strips HTML tags and reference markers.
 */
function extractCellTexts(rowHtml: string, isHeader: boolean): string[] {
  const cellTag = isHeader ? "th" : "td";
  const cellRegex = new RegExp(
    `<${cellTag}[^>]*>([\\s\\S]*?)<\\/${cellTag}>`,
    "gi"
  );
  const texts: string[] = [];
  let match;

  while ((match = cellRegex.exec(rowHtml)) !== null) {
    // Strip HTML tags, decode entities, clean up
    const text = match[1]
      .replace(/<[^>]+>/g, "") // Remove HTML tags
      .replace(/\[\d+\]/g, "") // Remove reference numbers like [1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    texts.push(text);
  }

  // Also try <th> in data rows (some Wikipedia tables mix th and td)
  if (!isHeader && texts.length === 0) {
    const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
    while ((match = thRegex.exec(rowHtml)) !== null) {
      const text = match[1]
        .replace(/<[^>]+>/g, "")
        .replace(/\[\d+\]/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      texts.push(text);
    }
  }

  return texts;
}

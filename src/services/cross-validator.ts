/**
 * TMDB ↔ Wikipedia Cross-Validator
 *
 * Matches Telugu movies from TMDB with Wikipedia release lists.
 * A movie is "validated" only if:
 *   1. It exists in TMDB with original_language === "te"
 *   2. It appears in the Wikipedia Telugu films list for the year
 *   3. The release dates are close enough (within 7 days tolerance)
 *
 * Title matching strategy:
 *   - Exact normalized match
 *   - Levenshtein distance <= 3 for short titles, <= 5 for long titles
 *   - Word-level subset matching (all words in one title appear in the other)
 *
 * Movies that fail validation are logged with reasons.
 */

import type { TeluguMovie } from "./telugu-pipeline";
import {
  normalizeTitle,
  type WikipediaTeluguMovie,
} from "./wikipedia-scraper";

export interface ValidationResult {
  /** Movies confirmed in both TMDB and Wikipedia */
  validated: TeluguMovie[];
  /** TMDB movies not found in Wikipedia */
  tmdbOnly: TeluguMovie[];
  /** Wikipedia movies not found in TMDB */
  wikiOnly: WikipediaTeluguMovie[];
  /** Log entries explaining exclusions */
  validationLog: string[];
}

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/**
 * Check if two titles fuzzy-match.
 * Returns true if they are sufficiently similar.
 */
function titlesFuzzyMatch(tmdbTitle: string, wikiTitle: string): boolean {
  const a = normalizeTitle(tmdbTitle);
  const b = normalizeTitle(wikiTitle);

  // Exact match
  if (a === b) return true;

  // Levenshtein with length-adaptive threshold
  const maxLen = Math.max(a.length, b.length);
  const threshold = maxLen <= 10 ? 2 : maxLen <= 20 ? 3 : 5;
  if (levenshtein(a, b) <= threshold) return true;

  // Word-level subset: all words of the shorter appear in the longer
  const wordsA = a.split(" ").filter(Boolean);
  const wordsB = b.split(" ").filter(Boolean);
  const shorter = wordsA.length <= wordsB.length ? wordsA : wordsB;
  const longer = wordsA.length <= wordsB.length ? wordsB : wordsA;
  if (shorter.length >= 2 && shorter.every((w) => longer.includes(w))) {
    return true;
  }

  // One title is a prefix/suffix of the other (handles subtitle differences)
  if (a.startsWith(b) || b.startsWith(a)) return true;

  return false;
}

/**
 * Check if two release dates are close enough.
 * Tolerance: 7 days (handles minor date discrepancies between sources).
 */
function datesMatch(
  tmdbDate: string | undefined,
  wikiDate: string | null
): boolean {
  if (!tmdbDate || !wikiDate) return true; // If either date is unknown, don't penalize

  const d1 = new Date(tmdbDate).getTime();
  const d2 = new Date(wikiDate).getTime();

  if (isNaN(d1) || isNaN(d2)) return true; // Can't compare invalid dates

  const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

/**
 * Cross-validate TMDB Telugu movies against Wikipedia release data.
 */
export function crossValidate(
  tmdbMovies: TeluguMovie[],
  wikiMovies: WikipediaTeluguMovie[]
): ValidationResult {
  const validated: TeluguMovie[] = [];
  const tmdbOnly: TeluguMovie[] = [];
  const validationLog: string[] = [];
  const matchedWikiIndices = new Set<number>();

  for (const tmdbMovie of tmdbMovies) {
    let bestMatch: { wikiMovie: WikipediaTeluguMovie; index: number } | null = null;

    for (let i = 0; i < wikiMovies.length; i++) {
      if (matchedWikiIndices.has(i)) continue;

      const wikiMovie = wikiMovies[i];
      if (titlesFuzzyMatch(tmdbMovie.title, wikiMovie.title)) {
        bestMatch = { wikiMovie, index: i };
        break;
      }
      // Also try original_title (TMDB may have a different title)
      if (
        tmdbMovie.original_title &&
        titlesFuzzyMatch(tmdbMovie.original_title, wikiMovie.title)
      ) {
        bestMatch = { wikiMovie, index: i };
        break;
      }
    }

    if (bestMatch) {
      const { wikiMovie, index } = bestMatch;

      if (datesMatch(tmdbMovie.release_date, wikiMovie.releaseDate)) {
        matchedWikiIndices.add(index);
        validated.push({ ...tmdbMovie, wikipedia_validated: true });
        validationLog.push(
          `[VALIDATED] "${tmdbMovie.title}" (TMDB) ↔ "${wikiMovie.title}" (Wiki) | Date: ${tmdbMovie.release_date} ↔ ${wikiMovie.releaseDate}`
        );
      } else {
        tmdbOnly.push(tmdbMovie);
        validationLog.push(
          `[DATE_MISMATCH] "${tmdbMovie.title}" TMDB date: ${tmdbMovie.release_date}, Wiki date: ${wikiMovie.releaseDate}`
        );
      }
    } else {
      // No Wikipedia match - still include from TMDB but mark as unvalidated
      tmdbOnly.push(tmdbMovie);
      validationLog.push(
        `[TMDB_ONLY] "${tmdbMovie.title}" (${tmdbMovie.release_date}) - no Wikipedia match found`
      );
    }
  }

  // Collect unmatched Wikipedia entries
  const wikiOnly = wikiMovies.filter((_, i) => !matchedWikiIndices.has(i));
  for (const w of wikiOnly) {
    validationLog.push(
      `[WIKI_ONLY] "${w.title}" (${w.releaseDate || "no date"}) - not found in TMDB`
    );
  }

  return { validated, tmdbOnly, wikiOnly, validationLog };
}

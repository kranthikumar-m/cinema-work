import "server-only";
import { unstable_cache } from "next/cache";
import { getTeluguNews, type NewsItem } from "@/services/telugu-news";
import { getTitleSimilarityScore, normalizeMovieTitle } from "@/lib/title-matching";

/**
 * Critic verdicts aggregated from the review pages we already scrape. Each
 * review article is fetched once (cached 6h) and its "x/5" rating extracted:
 * 123telugu prints "123telugu.com Rating: 3.25/5", Gulte embeds a JSON-LD
 * reviewRating. Reviews of the same film are averaged into one verdict.
 * Best-effort: reviews without a parsable rating are skipped.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const MAX_REVIEWS = 24;
const FETCH_BATCH = 6;

export interface CriticReview {
  movieTitle: string;
  normalizedTitle: string;
  /** Rating out of 5. */
  rating: number;
  source: NewsItem["source"];
  sourceLabel: string;
  url: string;
  publishedAt: string | null;
  image: string | null;
}

export interface CriticVerdict {
  movieTitle: string;
  normalizedTitle: string;
  /** Average rating out of 5, one decimal. */
  average: number;
  count: number;
  reviews: CriticReview[];
  latestAt: string | null;
  image: string | null;
}

/** "Review: Sahaa – An Emotional Ride" → "Sahaa"; "Kingdom Movie Review" → "Kingdom". */
export function extractMovieTitleFromReview(headline: string): string {
  let title = headline.replace(/\s+/g, " ").trim();
  title = title.replace(/^(movie\s+)?review\s*[:\-–—]\s*/i, "");
  title = title.replace(/\s*[:\-–—|(].*$/, "");
  title = title.replace(/\s+(movie\s+)?review(\s+(and|&)\s+rating)?\s*$/i, "");
  title = title.replace(/\s+telugu\s+movie\s*$/i, "");
  return title.trim();
}

function parseRating(html: string, source: NewsItem["source"]): number | null {
  const patterns: RegExp[] = [];
  if (source === "123telugu") {
    patterns.push(/123telugu\.com\s*Rating\s*:?\s*([0-5](?:\.\d+)?)\s*\\?\/\s*5/i);
  }
  patterns.push(/"reviewRating":\{[^}]*?"ratingValue":"?([0-5](?:\.\d+)?)"?/i);
  patterns.push(/Rating\s*:?\s*(?:<[^>]+>\s*)*([0-5](?:\.\d+)?)\s*\/\s*5/i);

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const value = Number(match[1]);
      if (Number.isFinite(value) && value >= 0 && value <= 5) return value;
    }
  }
  return null;
}

async function fetchReviewRating(item: NewsItem): Promise<number | null> {
  try {
    const res = await fetch(item.url, {
      headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
      next: { revalidate: 21600 },
    });
    if (!res.ok) return null;
    return parseRating(await res.text(), item.source);
  } catch {
    return null;
  }
}

const buildCriticVerdicts = unstable_cache(
  async (): Promise<CriticVerdict[]> => {
    const items = (await getTeluguNews("review", MAX_REVIEWS)).filter(
      (item) => item.source !== "teluguone"
    );
    const reviews: CriticReview[] = [];

    for (let i = 0; i < items.length; i += FETCH_BATCH) {
      const batch = items.slice(i, i + FETCH_BATCH);
      const ratings = await Promise.all(batch.map((item) => fetchReviewRating(item)));
      batch.forEach((item, index) => {
        const rating = ratings[index];
        if (rating == null) return;
        const movieTitle = extractMovieTitleFromReview(item.title);
        if (!movieTitle) return;
        reviews.push({
          movieTitle,
          normalizedTitle: normalizeMovieTitle(movieTitle),
          rating,
          source: item.source,
          sourceLabel: item.sourceLabel,
          url: item.url,
          publishedAt: item.publishedAt,
          image: item.image,
        });
      });
    }

    const groups = new Map<string, CriticReview[]>();
    for (const review of reviews) {
      // Fold near-identical titles (spelling variants across sites) together.
      let key = review.normalizedTitle;
      for (const existing of groups.keys()) {
        if (existing === key || getTitleSimilarityScore(existing, key) >= 0.85) {
          key = existing;
          break;
        }
      }
      const list = groups.get(key) ?? [];
      list.push(review);
      groups.set(key, list);
    }

    const verdicts: CriticVerdict[] = [];
    for (const [normalizedTitle, list] of groups) {
      const average =
        Math.round((list.reduce((sum, r) => sum + r.rating, 0) / list.length) * 10) / 10;
      const dated = list.map((r) => r.publishedAt).filter((d): d is string => Boolean(d)).sort();
      verdicts.push({
        movieTitle: list[0].movieTitle,
        normalizedTitle,
        average,
        count: list.length,
        reviews: list,
        latestAt: dated.length ? dated[dated.length - 1] : null,
        image: list.find((r) => r.image)?.image ?? null,
      });
    }

    return verdicts.sort((a, b) => (b.latestAt ?? "").localeCompare(a.latestAt ?? ""));
  },
  ["critic-verdicts-v1"],
  { revalidate: 21600 }
);

export async function getCriticVerdicts(limit = 8): Promise<CriticVerdict[]> {
  try {
    return (await buildCriticVerdicts()).slice(0, limit);
  } catch {
    return [];
  }
}

/** The verdict for one film, matched by title or any alias. */
export async function getCriticVerdictForMovie(
  title: string,
  aliases: string[] = []
): Promise<CriticVerdict | null> {
  const verdicts = await getCriticVerdicts(50);
  if (!verdicts.length) return null;
  const keys = [title, ...aliases].filter(Boolean).map(normalizeMovieTitle);
  return (
    verdicts.find((verdict) =>
      keys.some(
        (key) =>
          key === verdict.normalizedTitle ||
          getTitleSimilarityScore(key, verdict.normalizedTitle) >= 0.85
      )
    ) ?? null
  );
}

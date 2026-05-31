import { env } from "@/lib/env";

/**
 * Pluggable Twitter/X mention provider.
 *
 * Twitter killed free programmatic search, so counts come from a paid
 * third-party search API. The default target is twitterapi.io's advanced
 * search endpoint; override the URL via TWITTER_MENTIONS_API_URL and supply a
 * key via TWITTER_MENTIONS_API_KEY. With no key configured the provider is a
 * graceful no-op that returns 0 (logged once) so the rest of the app keeps
 * working.
 */

// Counting is capped to bound API spend — ordering among very high-volume
// titles is therefore approximate (a "100+" bucket). Tune as needed.
export const MENTION_COUNT_CAP = 100;
const MAX_PAGES = 5;

interface TwitterApiTweet {
  createdAt?: string;
  created_at?: string;
}

interface TwitterApiResponse {
  tweets?: TwitterApiTweet[];
  has_next_page?: boolean;
  next_cursor?: string;
}

let warnedMissingKey = false;

function buildSearchQuery(title: string): string {
  // Quote the title so multi-word names match as a phrase. Exclude retweets to
  // avoid inflating the count with duplicates.
  const trimmed = title.trim().replace(/"/g, "");
  return `"${trimmed}" -is:retweet`;
}

function parseTweetTimestamp(tweet: TwitterApiTweet): number | null {
  const raw = tweet.createdAt ?? tweet.created_at;
  if (!raw) return null;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Returns the number of recent (within `sinceHours`) tweets mentioning the
 * given query, capped at {@link MENTION_COUNT_CAP}. Returns 0 on any failure or
 * when no provider is configured.
 */
export async function getRecentMentionCount(
  query: string,
  sinceHours = 48
): Promise<number> {
  const apiKey = env.TWITTER_MENTIONS_API_KEY;
  const apiUrl = env.TWITTER_MENTIONS_API_URL;

  if (!apiKey || !apiUrl) {
    if (!warnedMissingKey) {
      console.warn(
        "[twitter-mentions] TWITTER_MENTIONS_API_KEY not set — mention counts will be 0."
      );
      warnedMissingKey = true;
    }
    return 0;
  }

  const windowStart = Date.now() - sinceHours * 60 * 60 * 1000;
  const searchQuery = buildSearchQuery(query);

  let count = 0;
  let cursor: string | undefined;

  try {
    for (let page = 0; page < MAX_PAGES && count < MENTION_COUNT_CAP; page += 1) {
      const url = new URL(apiUrl);
      url.searchParams.set("query", searchQuery);
      url.searchParams.set("queryType", "Latest");
      if (cursor) url.searchParams.set("cursor", cursor);

      const response = await fetch(url, {
        headers: { "X-API-Key": apiKey },
        cache: "no-store",
      });

      if (!response.ok) {
        console.warn(
          `[twitter-mentions] search failed (${response.status}) for "${query}".`
        );
        break;
      }

      const data = (await response.json()) as TwitterApiResponse;
      const tweets = data.tweets ?? [];
      if (!tweets.length) break;

      let reachedWindowEdge = false;
      for (const tweet of tweets) {
        const ts = parseTweetTimestamp(tweet);
        // Results are newest-first; once we pass the window edge, stop counting.
        if (ts !== null && ts < windowStart) {
          reachedWindowEdge = true;
          break;
        }
        count += 1;
        if (count >= MENTION_COUNT_CAP) break;
      }

      if (reachedWindowEdge || !data.has_next_page || !data.next_cursor) break;
      cursor = data.next_cursor;
    }
  } catch (error) {
    console.warn(
      `[twitter-mentions] error counting mentions for "${query}":`,
      error instanceof Error ? error.message : error
    );
    return 0;
  }

  return Math.min(count, MENTION_COUNT_CAP);
}

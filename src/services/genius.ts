import "server-only";
import { env } from "@/lib/env";
import { getTitleSimilarityScore } from "@/lib/title-matching";

/**
 * Song lyrics via Genius. The API only returns a song's page URL, so the lyrics
 * text is scraped from that page (Genius's terms restrict data reuse — enabled
 * per the project owner's decision; revisit before any commercial deploy).
 * Coverage of Telugu film songs is partial: popular tracks resolve, deeper ones
 * return null and the UI shows "lyrics not available". Search by SONG TITLE
 * only — appending the movie name breaks Genius's matching.
 */

const GENIUS_API = "https://api.genius.com";
const LYRIC_CACHE_SECONDS = 604800; // 7 days
const MATCH_MIN_SCORE = 0.7;
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface GeniusLyrics {
  lyrics: string;
  url: string;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (match, name: string) => NAMED_ENTITIES[name] ?? match);
}

/**
 * Extracts each `data-lyrics-container="true"` block by balancing <div>/</div>
 * so nested tags don't truncate the capture, then strips markup to plain text.
 */
function extractLyrics(html: string): string {
  const marker = 'data-lyrics-container="true"';
  const blocks: string[] = [];
  let from = 0;

  while (true) {
    const markerIdx = html.indexOf(marker, from);
    if (markerIdx === -1) break;
    const openEnd = html.indexOf(">", markerIdx);
    if (openEnd === -1) break;

    let depth = 1;
    let i = openEnd + 1;
    const start = i;
    while (i < html.length && depth > 0) {
      if (html.startsWith("<div", i)) {
        depth += 1;
        i += 4;
      } else if (html.startsWith("</div>", i)) {
        depth -= 1;
        if (depth === 0) break;
        i += 6;
      } else {
        i += 1;
      }
    }
    blocks.push(html.slice(start, i));
    from = i + 6;
  }

  const text = blocks
    .join("\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  return decodeEntities(text)
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function scrapeLyrics(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_USER_AGENT },
      next: { revalidate: LYRIC_CACHE_SECONDS },
    });
    if (!res.ok) return null;
    const lyrics = extractLyrics(await res.text());
    return lyrics.length > 0 ? lyrics : null;
  } catch {
    return null;
  }
}

/**
 * Resolves lyrics for a track: search Genius by title, pick the closest title
 * match (artist as a confidence boost) above MATCH_MIN_SCORE, then scrape it.
 */
export async function getLyricsForTrack(
  trackTitle: string,
  primaryArtist?: string
): Promise<GeniusLyrics | null> {
  const token = env.GENIUS_ACCESS_TOKEN;
  if (!token || !trackTitle) return null;

  try {
    const res = await fetch(`${GENIUS_API}/search?q=${encodeURIComponent(trackTitle)}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: LYRIC_CACHE_SECONDS },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      response?: {
        hits?: Array<{
          result?: { title?: string; url?: string; primary_artist?: { name?: string } };
        }>;
      };
    };
    const hits = data?.response?.hits ?? [];

    let bestUrl: string | null = null;
    let bestScore = 0;
    for (const hit of hits) {
      const result = hit.result;
      if (!result?.url || !result.title) continue;

      let score = getTitleSimilarityScore(trackTitle, result.title);
      if (primaryArtist && result.primary_artist?.name) {
        score += getTitleSimilarityScore(primaryArtist, result.primary_artist.name) * 0.2;
      }
      if (score > bestScore) {
        bestScore = score;
        bestUrl = result.url;
      }
    }
    if (!bestUrl || bestScore < MATCH_MIN_SCORE) return null;

    const lyrics = await scrapeLyrics(bestUrl);
    if (!lyrics) return null;
    return { lyrics, url: bestUrl };
  } catch {
    return null;
  }
}

import "server-only";
import { unstable_cache } from "next/cache";

/**
 * Aggregates real Telugu movie news/reviews/interviews from public sources
 * (Gulte, 123telugu, TeluguOne) by scraping their category pages. We extract
 * only headline + thumbnail + short excerpt + link and ALWAYS link back to the
 * original article (an aggregator, not a republisher) — the source owns the
 * content. Each category is cached for 30 minutes; any source that fails or
 * blocks degrades to an empty list rather than breaking the page.
 */

export type NewsCategory = "news" | "review" | "interview" | "feature";

export type NewsSource = "gulte" | "123telugu" | "teluguone";

export interface NewsItem {
  id: string; // the article URL (stable + unique)
  title: string;
  url: string;
  source: NewsSource;
  sourceLabel: string;
  image: string | null;
  excerpt: string | null;
  publishedAt: string | null; // ISO 8601, or null when the source omits it
  category: NewsCategory;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", raquo: "»", laquo: "«", rsquo: "’", lsquo: "‘",
  ldquo: "“", rdquo: "”", ndash: "–", mdash: "—",
};

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z0-9]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

// Strip tags + decode entities + collapse whitespace into clean display text.
function clean(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

function toIso(raw: string): string | null {
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// --- Source parsers -------------------------------------------------------

// Gulte (movienews / moviereviews / exclusive-interviews) — full fields. The
// per-article date lives in JSON-LD ("datePublished"), one per article in order.
function parseGulte(html: string, category: NewsCategory): NewsItem[] {
  const dates = [...html.matchAll(/"datePublished":"([^"]+)"/g)].map((m) => m[1]);
  const items: NewsItem[] = [];
  const articleRe = /<article class="item-list[^"]*">([\s\S]*?)<\/article>/g;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = articleRe.exec(html))) {
    const block = match[1];
    const titleM = block.match(
      /<h2 class="post-box-title">\s*<a\s+[^>]*?href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/
    );
    if (titleM) {
      const imgM = block.match(/<div class="post-thumbnail">[\s\S]*?<img[^>]*\bsrc="([^"]+)"/);
      const excerptM = block.match(/<div class="entry">\s*<p>([\s\S]*?)<\/p>/);
      items.push({
        id: titleM[1],
        url: titleM[1],
        title: clean(titleM[2]),
        source: "gulte",
        sourceLabel: "Gulte",
        image: imgM ? imgM[1] : null,
        excerpt: excerptM ? clean(excerptM[1]) : null,
        publishedAt: dates[index] ? toIso(dates[index]) : null,
        category,
      });
    }
    index += 1;
  }

  return items.filter((item) => item.title);
}

// 123telugu (mnews / reviews / interviews). mnews is title + link only; the
// reviews/interviews pages add a lazy-loaded thumbnail (data-bgset).
function parse123Telugu(html: string, category: NewsCategory): NewsItem[] {
  const titles = [
    ...html.matchAll(/<div class="pcsl-title">\s*<a\s+[^>]*?href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g),
  ];
  const thumbs = [...html.matchAll(/<div class="pcsl-thumb">[\s\S]*?data-bgset="([^"\s]+)/g)].map(
    (m) => m[1]
  );

  return titles
    .map((m, i) => ({
      id: m[1],
      url: m[1],
      title: clean(m[2]),
      source: "123telugu" as const,
      sourceLabel: "123telugu",
      image: thumbs[i] ?? null,
      excerpt: null,
      publishedAt: null,
      category,
    }))
    .filter((item) => item.title && /^https?:\/\//.test(item.url));
}

// TeluguOne — React SPA, but page 1 is prerendered. Real cards carry a date
// (onther-child-time); the trailing skeleton placeholders don't, so we skip them.
function parseTeluguOne(html: string, category: NewsCategory): NewsItem[] {
  const items: NewsItem[] = [];
  const cardRe = /<li class="movie-news-card">([\s\S]*?)<\/li>/g;
  let match: RegExpExecArray | null;

  while ((match = cardRe.exec(html))) {
    const block = match[1];
    if (!/onther-child-time/.test(block)) continue; // skeleton placeholder

    const urlM = block.match(/href="(\/news\/[^"]+\.html)"/);
    if (!urlM) continue;
    const titleM = block.match(/<h6 class="movie-news-card-title-tl">([\s\S]*?)<\/h6>/);
    const title = titleM ? clean(titleM[1]) : "";
    if (!title) continue;

    const imgM = block.match(/<img[^>]*\bsrc="([^"]+)"[^>]*class="movie-news-card-img"/);
    const descM = block.match(/<p class="movie-news-card-description-tl">([\s\S]*?)<\/p>/);
    const dateM = block.match(/<span class="onther-child-time">([^<]+)<\/span>/);

    items.push({
      id: `https://www.teluguone.com${urlM[1]}`,
      url: `https://www.teluguone.com${urlM[1]}`,
      title,
      source: "teluguone",
      sourceLabel: "TeluguOne",
      image: imgM ? imgM[1] : null,
      excerpt: descM ? truncate(clean(descM[1]), 200) : null,
      publishedAt: dateM ? toIso(dateM[1].replace(/(\d)(AM|PM)/i, "$1 $2")) : null,
      category,
    });
  }

  return items;
}

// --- Aggregation ----------------------------------------------------------

interface SourceSpec {
  url: string;
  parse: (html: string, category: NewsCategory) => NewsItem[];
}

const SOURCES: Record<NewsCategory, SourceSpec[]> = {
  news: [
    { url: "https://www.gulte.com/category/movienews", parse: parseGulte },
    { url: "https://www.123telugu.com/category/mnews", parse: parse123Telugu },
    { url: "https://teluguone.com/tmdb/pages/contentlist-tl-1.html", parse: parseTeluguOne },
  ],
  review: [
    { url: "https://www.gulte.com/category/moviereviews", parse: parseGulte },
    { url: "https://www.123telugu.com/category/reviews", parse: parse123Telugu },
  ],
  interview: [
    { url: "https://www.123telugu.com/category/interviews", parse: parse123Telugu },
    { url: "https://www.gulte.com/category/videos/exclusive-interviews", parse: parseGulte },
  ],
  feature: [
    { url: "https://teluguone.com/tmdb/pages/contentlist-tl-1.html", parse: parseTeluguOne },
  ],
};

function dedupeByUrl(items: NewsItem[]): NewsItem[] {
  const map = new Map<string, NewsItem>();
  for (const item of items) {
    if (!map.has(item.url)) map.set(item.url, item);
  }
  return Array.from(map.values());
}

// Dated items first (newest first); items the source omits a date for keep
// their original (already newest-first) order at the end.
function sortNews(items: NewsItem[]): NewsItem[] {
  const dated = items
    .filter((i) => i.publishedAt)
    .sort((a, b) => (b.publishedAt as string).localeCompare(a.publishedAt as string));
  const undated = items.filter((i) => !i.publishedAt);
  return [...dated, ...undated];
}

const getCachedCategoryNews = unstable_cache(
  async (category: NewsCategory): Promise<NewsItem[]> => {
    const sources = SOURCES[category] ?? [];
    const results = await Promise.all(
      sources.map(async (spec) => {
        const html = await fetchHtml(spec.url);
        return html ? spec.parse(html, category) : [];
      })
    );
    return sortNews(dedupeByUrl(results.flat()));
  },
  ["telugu-news-v1"],
  { revalidate: 1800 }
);

export async function getTeluguNews(
  category: NewsCategory,
  limit = 36
): Promise<NewsItem[]> {
  const items = await getCachedCategoryNews(category);
  return items.slice(0, limit);
}

/** Combined, category-tagged feed for the home page's filterable Stories rail. */
export async function getHomeNewsFeed(): Promise<NewsItem[]> {
  const [news, reviews, interviews] = await Promise.all([
    getTeluguNews("news", 12),
    getTeluguNews("review", 6),
    getTeluguNews("interview", 6),
  ]);
  return dedupeByUrl([...news, ...reviews, ...interviews]);
}

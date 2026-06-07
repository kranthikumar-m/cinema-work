import "server-only";
import { cache } from "react";
import { getWatchProviderList } from "@/services/tmdb";
import { getTeluguTitleSimilarityScore, normalizeMovieTitle } from "@/lib/title-matching";

/**
 * Scrapes 123telugu's OTT page ("Current & Upcoming OTT Releases" and "Recent
 * Weeks' OTT Releases") to learn which Telugu films are streaming on which
 * Indian OTT platform — data TMDB's IN watch providers often lack. Platform
 * names are resolved to TMDB provider logos. India only. Cached, with graceful
 * empty-list fallbacks.
 */

const OTT_URL = "https://www.123telugu.com/videos/ott";

export interface OttProvider {
  name: string;
  logoPath: string | null;
}

interface TeluguOttEntry {
  title: string;
  normalizedTitle: string;
  platform: string;
}

function normKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCharCode(Number.parseInt(c, 16)));
}

function cleanText(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function parseOttPage(html: string): TeluguOttEntry[] {
  const out: TeluguOttEntry[] = [];
  const tableRe = /<table class="t123-table">([\s\S]*?)<\/table>/gi;
  for (const table of html.matchAll(tableRe)) {
    const rowRe = /<tr>([\s\S]*?)<\/tr>/gi;
    for (const row of table[1].matchAll(rowRe)) {
      const body = row[1];
      const platformMatch = body.match(/<span class="t123-platform">([\s\S]*?)<\/span>/i);
      if (!platformMatch) continue;
      const anchorMatch = body.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
      const rawTitle = anchorMatch ? anchorMatch[1] : body.match(/<td[^>]*>([\s\S]*?)<\/td>/i)?.[1] ?? "";
      // Strip the trailing descriptor, e.g. "(Telugu Film)" / "(Hindi Film - Telugu Dub)".
      const title = cleanText(rawTitle).replace(/\s*\([^)]*\)\s*$/, "").trim();
      const platform = cleanText(platformMatch[1]);
      if (!title || !platform) continue;
      // Skip "(Overseas)" markers — those aren't Indian OTT availability.
      if (/overseas/i.test(platform)) continue;
      out.push({ title, normalizedTitle: normalizeMovieTitle(title), platform });
    }
  }
  return out;
}

const getTeluguOttReleases = cache(async (): Promise<TeluguOttEntry[]> => {
  try {
    const res = await fetch(OTT_URL, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
      },
      next: { revalidate: 21600 },
    });
    if (!res.ok) return [];
    return parseOttPage(await res.text());
  } catch {
    return [];
  }
});

// Maps a normalized provider name → its TMDB logo, for IN providers.
const getIndiaProviderLogos = cache(
  async (): Promise<Map<string, { name: string; logoPath: string }>> => {
    try {
      const list = (await getWatchProviderList("IN")).results ?? [];
      const map = new Map<string, { name: string; logoPath: string }>();
      for (const provider of list) {
        if (!provider.provider_name || !provider.logo_path) continue;
        map.set(normKey(provider.provider_name), {
          name: provider.provider_name,
          logoPath: provider.logo_path,
        });
      }
      return map;
    } catch {
      return new Map();
    }
  }
);

// 123telugu platform spelling → TMDB provider key (only where they diverge).
const PLATFORM_ALIASES: Record<string, string> = {
  primevideo: "amazonprimevideo",
  amazonprime: "amazonprimevideo",
  hotstar: "jiohotstar",
  disneyhotstar: "jiohotstar",
  disneyplushotstar: "jiohotstar",
  jiocinema: "jiohotstar",
  appletvplus: "appletv",
  appletv: "appletv",
};

function resolvePlatform(
  platform: string,
  logos: Map<string, { name: string; logoPath: string }>
): OttProvider {
  const key = normKey(platform);
  const aliased = PLATFORM_ALIASES[key] ?? key;
  const hit =
    logos.get(aliased) ??
    logos.get(key) ??
    [...logos.values()].find((v) => {
      const n = normKey(v.name);
      return n === aliased || n.includes(key) || key.includes(n);
    });
  return { name: hit?.name ?? platform, logoPath: hit?.logoPath ?? null };
}

function matchesTitle(title: string, entry: TeluguOttEntry): boolean {
  if (normalizeMovieTitle(title) === entry.normalizedTitle) return true;
  return getTeluguTitleSimilarityScore(title, entry.title) >= 0.85;
}

/**
 * India OTT providers for a movie, sourced from 123telugu and given TMDB logos.
 * Matched against the title and any alias tags.
 */
export async function getMovieIndiaOttProviders(
  title: string,
  aliases: string[] = []
): Promise<OttProvider[]> {
  const [entries, logos] = await Promise.all([
    getTeluguOttReleases(),
    getIndiaProviderLogos(),
  ]);
  if (!entries.length) return [];

  const titles = [title, ...aliases].filter(Boolean);
  const seen = new Set<string>();
  const out: OttProvider[] = [];
  for (const entry of entries) {
    if (!titles.some((t) => matchesTitle(t, entry))) continue;
    const provider = resolvePlatform(entry.platform, logos);
    const key = normKey(provider.name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(provider);
  }
  return out;
}

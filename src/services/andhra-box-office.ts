import "server-only";
import { cache } from "react";
import { normalizeMovieTitle } from "@/lib/title-matching";

/**
 * Scrapes AndhraBoxOffice's Telugu release calendar as a SECONDARY validation
 * source for upcoming films — many announced Telugu films aren't on Wikipedia's
 * dated lists yet, but appear here. The page is a flat list grouped by year and
 * month, with lines like "26 Lenin" (Telugu) or "26 (Hin) Welcome To The
 * Jungle" (other language). We keep untagged or "(Tel…)" lines and skip the
 * rest. Cached 6h; degrades to an empty list on any failure.
 */

const ABO_URL = "http://andhraboxoffice.com/info.aspx?cid=9&id=21457";

const MONTHS = new Map<string, string>([
  ["january", "01"], ["february", "02"], ["march", "03"], ["april", "04"],
  ["may", "05"], ["june", "06"], ["july", "07"], ["august", "08"],
  ["september", "09"], ["october", "10"], ["november", "11"], ["december", "12"],
]);

// Language tags that mark a NON-Telugu release (anything not "Tel" is skipped).
const NON_TELUGU_TAG = /^(hin|eng|tam|kan|mal|mar|ben|guj|pun|odi|kor|jap|chi|spa|fra)\b/i;

export interface AndhraBoxOfficeEntry {
  title: string;
  normalizedTitle: string;
  releaseDate: string | null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}

function parseAndhraBoxOffice(html: string): AndhraBoxOfficeEntry[] {
  const text = decodeEntities(
    html
      // Drop script/style bodies first so their JS/CSS text isn't parsed as rows.
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  ).replace(/[ \t]+/g, " ");

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  const out: AndhraBoxOfficeEntry[] = [];
  let year: string | null = null;
  let month: string | null = null;

  for (const line of lines) {
    if (/^20\d{2}$/.test(line)) {
      year = line;
      continue;
    }
    const monthNum = MONTHS.get(line.toLowerCase());
    if (monthNum) {
      month = monthNum;
      continue;
    }

    // Entry line: leading day (optionally "10/Oct" or "10/17"), then title.
    const entry = line.match(/^(\d{1,2})(?:\/[A-Za-z0-9]+)?\s+(.+)$/);
    if (!entry) continue;

    let rest = entry[2].trim();
    const tag = rest.match(/^\(([^)]*)\)\s*/);
    if (tag) {
      const inside = tag[1].trim();
      // Skip non-Telugu releases; keep "(Tel & dub)" etc.
      if (NON_TELUGU_TAG.test(inside)) continue;
      rest = rest.slice(tag[0].length).trim();
    }

    const title = rest.replace(/\s+/g, " ").trim();
    if (title.length < 2) continue;

    const day = entry[1].padStart(2, "0");
    out.push({
      title,
      normalizedTitle: normalizeMovieTitle(title),
      releaseDate: year && month ? `${year}-${month}-${day}` : null,
    });
  }

  return out;
}

export const getAndhraBoxOfficeUpcoming = cache(
  async (): Promise<AndhraBoxOfficeEntry[]> => {
    try {
      const response = await fetch(ABO_URL, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; TeluguCinemaUpdatesBot/1.0; +https://example.com)",
          "accept-language": "en-US,en;q=0.9",
        },
        next: { revalidate: 21600 },
      });
      if (!response.ok) return [];
      return parseAndhraBoxOffice(await response.text());
    } catch {
      return [];
    }
  }
);

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { env } from "@/lib/env";
import {
  getLatestTeluguReleases,
  getUpcomingTeluguMovies,
  runValidationBackfill,
  VALIDATED_CATALOG_CACHE_TAG,
} from "@/services/telugu-movies";
import { getRecentMentionCount } from "@/services/twitter-mentions";
import { warmBirthdayRoster } from "@/services/telugu-birthdays";
import { upsertTrendingMentionCount, hasDatabaseConfiguration } from "@/lib/database";
import type { Movie } from "@/types/tmdb";

export const dynamic = "force-dynamic";
// Allow up to the platform max — counting mentions for many titles is slow.
export const maxDuration = 300;

// Bound the number of third-party API calls per run to control cost.
const CANDIDATE_CAP = 50;
const MENTION_WINDOW_HOURS = 48;

function isAuthorized(request: Request): boolean {
  const secret = env.CRON_SECRET;
  // No secret configured (e.g. local dev) — allow.
  if (!secret) return true;

  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("secret");
  const authHeader = request.headers.get("authorization");
  const fromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  return fromQuery === secret || fromHeader === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasDatabaseConfiguration()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  try {
    // Advance the resumable past-year backfill by up to one year's worth of
    // quarters (the only place the multi-year validation runs — bounded and
    // throttled, off the user request path).
    const backfill = await runValidationBackfill().catch(() => ({
      processedQuarters: [] as { year: number; quarter: number; count: number }[],
      frozenYears: [] as number[],
    }));
    if (backfill.processedQuarters.length) {
      // Newly validated quarters are available — rebuild the cached catalog.
      revalidateTag(VALIDATED_CATALOG_CACHE_TAG);
    }

    // Released + upcoming pools already include admin-added movies.
    const [released, upcoming] = await Promise.all([
      getLatestTeluguReleases(CANDIDATE_CAP).catch(() => [] as Movie[]),
      getUpcomingTeluguMovies(CANDIDATE_CAP).catch(() => [] as Movie[]),
    ]);

    const seen = new Set<number>();
    const candidates: Movie[] = [];
    // Prioritise recent releases, then upcoming, until the cap is hit.
    for (const movie of [...released, ...upcoming]) {
      if (seen.has(movie.id)) continue;
      seen.add(movie.id);
      candidates.push(movie);
    }

    const totalCandidates = candidates.length;
    const toProcess = candidates.slice(0, CANDIDATE_CAP);
    const dropped = totalCandidates - toProcess.length;
    if (dropped > 0) {
      console.warn(
        `[refresh-trending] candidate cap reached: processing ${toProcess.length} of ${totalCandidates} (dropped ${dropped}).`
      );
    }

    // Warm the birthdays roster (TMDB person lookups) off the request path.
    const birthdayRosterSize = await warmBirthdayRoster();

    const updatedAt = new Date().toISOString();
    let processed = 0;

    // Sequential to stay within third-party rate limits.
    for (const movie of toProcess) {
      const count = await getRecentMentionCount(movie.title, MENTION_WINDOW_HOURS);
      await upsertTrendingMentionCount(movie.id, count, updatedAt);
      processed += 1;
    }

    return NextResponse.json({
      ok: true,
      processed,
      dropped,
      validation: {
        processedQuarters: backfill.processedQuarters,
        frozenYears: backfill.frozenYears,
      },
      birthdayRosterSize,
      updatedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to refresh trending signals.";
    console.error("[refresh-trending]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

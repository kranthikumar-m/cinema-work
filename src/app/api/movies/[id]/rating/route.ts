import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/admin-api";
import { getCurrentUser } from "@/lib/auth";
import {
  getUserRatingRecord,
  hasDatabaseConfiguration,
  upsertUserRatingRecord,
  type WatchStatus,
} from "@/lib/database";
import { getMovieCommunitySummary } from "@/services/community";

interface RouteContext {
  params: { id: string };
}

const WATCH_STATUSES: WatchStatus[] = ["watched", "want", "no"];

function parseMovieId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Aggregate user rating for a movie plus the caller's own rating, if any. */
export async function GET(_request: Request, { params }: RouteContext) {
  const movieId = parseMovieId(params.id);
  if (!movieId) return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const user = await getCurrentUser();
  const [summary, mine] = await Promise.all([
    getMovieCommunitySummary(movieId),
    user ? getUserRatingRecord(user.id, movieId) : Promise.resolve(null),
  ]);

  return NextResponse.json(
    {
      summary,
      mine: user ? { rating: mine?.rating ?? null, watchStatus: mine?.watch_status ?? null } : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * Sets the caller's star rating (1–5, or null to clear) and/or watch status.
 * Fields left out of the body keep their current value.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireAuthenticatedApiUser();
  if (auth.response) return auth.response;

  const movieId = parseMovieId(params.id);
  if (!movieId) return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  let body: { rating?: unknown; watchStatus?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const existing = await getUserRatingRecord(auth.user.id, movieId);
  let rating = existing?.rating ?? null;
  let watchStatus: WatchStatus | null = existing?.watch_status ?? null;

  if ("rating" in body) {
    if (body.rating === null) rating = null;
    else {
      const value = Number(body.rating);
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        return NextResponse.json({ error: "rating must be a whole number from 1 to 5." }, { status: 400 });
      }
      rating = value;
    }
  }
  if ("watchStatus" in body) {
    if (body.watchStatus === null) watchStatus = null;
    else if (WATCH_STATUSES.includes(body.watchStatus as WatchStatus)) {
      watchStatus = body.watchStatus as WatchStatus;
    } else {
      return NextResponse.json(
        { error: `watchStatus must be one of: ${WATCH_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
  }

  await upsertUserRatingRecord({
    userId: auth.user.id,
    movieId,
    rating,
    watchStatus,
    updatedAt: new Date().toISOString(),
  });

  const summary = await getMovieCommunitySummary(movieId);
  return NextResponse.json({ ok: true, summary, mine: { rating, watchStatus } });
}

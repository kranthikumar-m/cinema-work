import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/admin-api";
import { getCurrentUser } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/auth-rate-limit";
import {
  deleteUserReviewRecord,
  getUserReviewRecord,
  hasDatabaseConfiguration,
  listUserReviewRecordsForMovie,
  upsertUserReviewRecord,
} from "@/lib/database";
import { toReviewView } from "@/services/community";

interface RouteContext {
  params: { id: string };
}

const TITLE_MAX = 120;
const BODY_MIN = 20;
const BODY_MAX = 4000;

function parseMovieId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Published user reviews for a movie (the caller's own review is flagged). */
export async function GET(_request: Request, { params }: RouteContext) {
  const movieId = parseMovieId(params.id);
  if (!movieId) return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  if (!hasDatabaseConfiguration()) return NextResponse.json({ reviews: [] });

  const user = await getCurrentUser();
  const rows = await listUserReviewRecordsForMovie(movieId, false);
  return NextResponse.json(
    { reviews: rows.map((row) => toReviewView(row, user?.id ?? null)) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/** Creates or replaces the caller's review of a movie. One review per user per film. */
export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireAuthenticatedApiUser();
  if (auth.response) return auth.response;

  const movieId = parseMovieId(params.id);
  if (!movieId) return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const limit = consumeRateLimit("user-review", String(auth.user.id), {
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You are posting reviews too quickly. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } }
    );
  }

  let body: { title?: unknown; body?: unknown; rating?: unknown; movieTitle?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  const movieTitle = typeof body.movieTitle === "string" ? body.movieTitle.trim() : "";
  if (!title || title.length > TITLE_MAX) {
    return NextResponse.json({ error: `Give your review a title (up to ${TITLE_MAX} characters).` }, { status: 400 });
  }
  if (text.length < BODY_MIN || text.length > BODY_MAX) {
    return NextResponse.json(
      { error: `Reviews must be between ${BODY_MIN} and ${BODY_MAX} characters.` },
      { status: 400 }
    );
  }
  let rating: number | null = null;
  if (body.rating !== undefined && body.rating !== null) {
    const value = Number(body.rating);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return NextResponse.json({ error: "rating must be a whole number from 1 to 5." }, { status: 400 });
    }
    rating = value;
  }

  const now = new Date().toISOString();
  const existing = await getUserReviewRecord(auth.user.id, movieId);
  const row = await upsertUserReviewRecord({
    userId: auth.user.id,
    movieId,
    movieTitle: movieTitle || existing?.movie_title || `Movie ${movieId}`,
    authorName: auth.user.name?.trim() || auth.user.email.split("@")[0],
    title,
    body: text,
    rating,
    // An edited review keeps its moderation status; a new one is published.
    status: existing?.status ?? "published",
    createdAt: existing?.created_at ?? now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true, review: row ? toReviewView(row, auth.user.id) : null });
}

/** Removes the caller's own review. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAuthenticatedApiUser();
  if (auth.response) return auth.response;

  const movieId = parseMovieId(params.id);
  if (!movieId) return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const existing = await getUserReviewRecord(auth.user.id, movieId);
  if (existing) await deleteUserReviewRecord(existing.id);
  return NextResponse.json({ ok: true });
}

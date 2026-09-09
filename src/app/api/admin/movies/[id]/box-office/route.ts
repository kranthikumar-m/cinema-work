import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import {
  deleteBoxOfficeRecord,
  getBoxOfficeRecord,
  hasDatabaseConfiguration,
  upsertBoxOfficeRecord,
} from "@/lib/database";
import { getMovieDetails } from "@/services/tmdb";

interface RouteContext {
  params: { id: string };
}

function parseMovieId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;
  const movieId = parseMovieId(params.id);
  if (!movieId) return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  if (!hasDatabaseConfiguration()) return NextResponse.json({ entry: null });
  const row = await getBoxOfficeRecord(movieId);
  return NextResponse.json({ entry: row }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * Saves the admin-entered box office figure for a film. The figure is free
 * text ("₹1716 Cr") because sources report in different currencies and units.
 * Body: { worldwideGross, note?, asOf? }.
 */
export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;
  const movieId = parseMovieId(params.id);
  if (!movieId) return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  let body: { worldwideGross?: unknown; note?: unknown; asOf?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const worldwideGross = typeof body.worldwideGross === "string" ? body.worldwideGross.trim() : "";
  if (!worldwideGross || worldwideGross.length > 60) {
    return NextResponse.json({ error: "Enter the worldwide gross, e.g. ₹120 Cr." }, { status: 400 });
  }
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 200) : null;
  const asOf =
    typeof body.asOf === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.asOf.trim()) ? body.asOf.trim() : null;

  // Snapshot title/poster so the widget never needs a TMDB call per row.
  let movieTitle = `Movie ${movieId}`;
  let posterPath: string | null = null;
  let releaseDate: string | null = null;
  try {
    const details = await getMovieDetails(movieId);
    movieTitle = details.title || movieTitle;
    posterPath = details.poster_path ?? null;
    releaseDate = details.release_date || null;
  } catch {
    /* keep placeholders */
  }

  await upsertBoxOfficeRecord({
    movieId,
    movieTitle,
    posterPath,
    releaseDate,
    worldwideGross,
    note,
    asOf,
    addedByUserId: auth.user.id,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;
  const movieId = parseMovieId(params.id);
  if (!movieId) return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  await deleteBoxOfficeRecord(movieId);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import {
  insertManualMovieRecord,
  deleteManualMovieRecord,
  getManualMovieRecord,
} from "@/lib/database";
import { getMovieDetails } from "@/services/tmdb";

interface RouteContext {
  params: { id: string };
}

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const existing = await getManualMovieRecord(movieId);
    if (existing) {
      return NextResponse.json({ error: "Movie already added." }, { status: 409 });
    }

    const movie = await getMovieDetails(movieId);

    const record = await insertManualMovieRecord({
      movieId: movie.id,
      tmdbTitle: movie.title,
      releaseDate: movie.release_date || null,
      addedByUserId: auth.user.id,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add movie.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    await deleteManualMovieRecord(movieId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove movie.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

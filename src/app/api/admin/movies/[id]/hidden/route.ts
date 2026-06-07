import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { addHiddenMovie, removeHiddenMovie } from "@/lib/database";

interface RouteContext {
  params: { id: string };
}

/**
 * Hides a movie from every catalog/listing (admin "Remove movie"). The film
 * isn't deleted from TMDB — it's recorded in `hidden_movies` and filtered out
 * of the collections. DELETE restores it.
 */
export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    await addHiddenMovie({
      movieId,
      addedByUserId: auth.user.id,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to hide movie.";
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
    await removeHiddenMovie(movieId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to restore movie.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

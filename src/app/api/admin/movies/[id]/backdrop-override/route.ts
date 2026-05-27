import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import {
  clearMovieBackdropOverride,
  getMovieBackdropChoices,
  setMovieBackdropOverride,
} from "@/services/movie-backdrops";

interface RouteContext {
  params: { id: string };
}

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);

  if (auth.response) {
    return auth.response;
  }

  const user = auth.user;

  const movieId = Number(params.id);

  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { selectedBackdropPath?: string };
    const selectedBackdropPath = body.selectedBackdropPath?.trim() ?? "";

    if (!selectedBackdropPath) {
      return NextResponse.json(
        { error: "selectedBackdropPath is required." },
        { status: 400 }
      );
    }

    await setMovieBackdropOverride(movieId, selectedBackdropPath, user.id);
    const payload = await getMovieBackdropChoices(movieId);
    return NextResponse.json({ ok: true, payload });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save override.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);

  if (auth.response) {
    return auth.response;
  }

  const movieId = Number(params.id);

  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    await clearMovieBackdropOverride(movieId);
    const payload = await getMovieBackdropChoices(movieId);
    return NextResponse.json({ ok: true, payload });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to clear override.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

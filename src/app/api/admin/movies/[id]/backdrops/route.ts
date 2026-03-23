import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { getMovieBackdropChoices } from "@/services/movie-backdrops";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);

  if (auth.response) {
    return auth.response;
  }

  const movieId = Number(params.id);

  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const payload = await getMovieBackdropChoices(movieId);
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load backdrops.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

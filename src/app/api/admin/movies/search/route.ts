import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { searchAdminMovies } from "@/services/admin-movies";

export async function GET(request: Request) {
  const auth = await requireAdminApiUser(["admin", "editor"]);

  if (auth.response) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchAdminMovies(query, 10);
    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to search movies.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

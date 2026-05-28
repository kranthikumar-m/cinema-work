import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { searchSongsForMovie } from "@/services/song-sync";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const movieTitle = searchParams.get("title")?.trim() ?? "";
  const releaseDate = searchParams.get("releaseDate") || null;

  if (!movieTitle) {
    return NextResponse.json({ results: [] });
  }

  if (!env.YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: "YouTube API key is not configured. Set YOUTUBE_API_KEY in your environment." },
      { status: 500 }
    );
  }

  try {
    const results = await searchSongsForMovie(movieTitle, releaseDate);
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Song search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { listManualMovieRecords } from "@/lib/database";
import type { ManualMovieRecord } from "@/types/admin";

function mapRow(row: {
  movie_id: number;
  tmdb_title: string;
  release_date: string | null;
  added_by_user_id: number | null;
  created_at: string;
}): ManualMovieRecord {
  return {
    movieId: row.movie_id,
    tmdbTitle: row.tmdb_title,
    releaseDate: row.release_date,
    addedByUserId: row.added_by_user_id,
    createdAt: row.created_at,
  };
}

export async function GET() {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  try {
    const rows = await listManualMovieRecords();
    return NextResponse.json({ results: rows.map(mapRow) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list added movies.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

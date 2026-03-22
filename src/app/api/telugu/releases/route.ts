import { NextRequest, NextResponse } from "next/server";
import { getLatestTeluguMovies } from "@/services/telugu-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page");
  const maxPages = page ? parseInt(page, 10) : 3;

  try {
    const movies = await getLatestTeluguMovies(Math.min(maxPages, 10));
    return NextResponse.json({
      movies,
      total: movies.length,
      source: "tmdb",
    });
  } catch (error) {
    console.error("[API] Telugu releases error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Telugu releases", movies: [] },
      { status: 500 }
    );
  }
}

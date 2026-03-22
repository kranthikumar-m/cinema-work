import { NextRequest, NextResponse } from "next/server";
import { searchTeluguMovies } from "@/services/telugu-movies";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data = await searchTeluguMovies(q);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search movies", results: [] },
      { status: 500 }
    );
  }
}

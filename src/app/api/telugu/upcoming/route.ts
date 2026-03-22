import { NextResponse } from "next/server";
import { getUpcomingTeluguReleases } from "@/services/telugu-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const movies = await getUpcomingTeluguReleases();
    return NextResponse.json({
      movies,
      total: movies.length,
      source: "tmdb",
    });
  } catch (error) {
    console.error("[API] Telugu upcoming error:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming Telugu releases", movies: [] },
      { status: 500 }
    );
  }
}

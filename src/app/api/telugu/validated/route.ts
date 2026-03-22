import { NextRequest, NextResponse } from "next/server";
import { getValidatedTeluguReleases } from "@/services/telugu-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  try {
    const { movies, validation } = await getValidatedTeluguReleases(year);
    return NextResponse.json({
      year,
      movies,
      total: movies.length,
      validatedCount: validation.validated.length,
      tmdbOnlyCount: validation.tmdbOnly.length,
      wikiOnlyCount: validation.wikiOnly.length,
      validationLog: validation.validationLog,
    });
  } catch (error) {
    console.error("[API] Telugu validated error:", error);
    return NextResponse.json(
      { error: "Failed to fetch validated Telugu releases", movies: [] },
      { status: 500 }
    );
  }
}

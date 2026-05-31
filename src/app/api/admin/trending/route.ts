import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { getTeluguTrendingMovies } from "@/services/telugu-movies";
import { listTrendingSignalRecords } from "@/lib/database";
import { getIndianTodayIsoDate } from "@/lib/date";
import { getMoviePosterUrl } from "@/lib/utils";
import type { AdminTrendingMovie } from "@/types/admin";

export const dynamic = "force-dynamic";

const ADMIN_TRENDING_LIMIT = 50;

export async function GET() {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  try {
    const [movies, signals] = await Promise.all([
      getTeluguTrendingMovies(ADMIN_TRENDING_LIMIT),
      listTrendingSignalRecords(),
    ]);

    const signalById = new Map(signals.map((signal) => [signal.movie_id, signal]));
    const today = getIndianTodayIsoDate();

    const results: AdminTrendingMovie[] = movies.map((movie) => {
      const signal = signalById.get(movie.id);
      const released = Boolean(movie.release_date && movie.release_date <= today);

      return {
        id: movie.id,
        title: movie.title,
        posterUrl: getMoviePosterUrl(movie, "w300"),
        releaseDate: movie.release_date || null,
        releaseStatus: released ? "released" : "upcoming",
        mentionCount: signal?.mention_count ?? 0,
        mentionsUpdatedAt: signal?.mentions_updated_at ?? null,
        adminOrder: signal?.admin_order ?? null,
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load trending movies.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { getLatestTeluguReleases } from "@/services/telugu-movies";
import { getMovieDetails } from "@/services/tmdb";
import { enrichMovieAssets } from "@/services/telugu-movies";
import { listManualMovieRecords, hasDatabaseConfiguration } from "@/lib/database";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { Movie } from "@/types/tmdb";

export const metadata = { title: "Telugu Releases - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

async function getManualRecentMovies(): Promise<Movie[]> {
  if (!hasDatabaseConfiguration()) return [];
  const rows = await listManualMovieRecords().catch(() => []);
  if (!rows.length) return [];

  const today = new Date().toISOString().slice(0, 10);
  const recentRows = rows.filter((r) => r.release_date && r.release_date <= today);

  const results = await Promise.allSettled(
    recentRows.map((row) =>
      getMovieDetails(row.movie_id).then((d) => enrichMovieAssets(d as unknown as Movie))
    )
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Movie> => r.status === "fulfilled")
    .map((r) => r.value);
}

export default async function TrendingPage() {
  try {
    const [validated, manual] = await Promise.all([
      getLatestTeluguReleases(30),
      getManualRecentMovies(),
    ]);

    const ids = new Set(validated.map((m) => m.id));
    const merged = [...validated];
    for (const m of manual) {
      if (!ids.has(m.id)) {
        merged.push(m);
        ids.add(m.id);
      }
    }
    merged.sort((a, b) =>
      (b.release_date || "").localeCompare(a.release_date || "")
    );

    return (
      <div className="app-page-shell py-8">
        <SectionHeader title="Telugu Releases" />
        <MovieGrid movies={merged} />
      </div>
    );
  } catch {
    return (
      <div className="app-page-shell py-8">
        <SectionHeader title="Telugu Releases" />
        <p className="text-gray-400">Unable to load Telugu releases. Please try again later.</p>
      </div>
    );
  }
}

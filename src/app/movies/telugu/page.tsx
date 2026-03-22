import { getTeluguMovies } from "@/services/tmdb";
import { getLatestTeluguMovies, getUpcomingTeluguReleases } from "@/services/telugu-data";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Telugu Movies - TCU" };
export const dynamic = "force-dynamic";

export default async function TeluguMoviesPage() {
  try {
    const [pipelineMovies, upcoming, tmdbFallback] = await Promise.all([
      getLatestTeluguMovies(5),
      getUpcomingTeluguReleases(),
      getTeluguMovies(),
    ]);

    // Use pipeline data if available, otherwise fall back to basic TMDB discover
    const released = pipelineMovies.length > 0 ? pipelineMovies : tmdbFallback.results;

    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Latest Telugu Releases" />
        <MovieGrid movies={released} />

        {upcoming.length > 0 && (
          <div className="mt-12">
            <SectionHeader title="Upcoming Telugu Movies" />
            <MovieGrid movies={upcoming} />
          </div>
        )}
      </div>
    );
  } catch {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Telugu Movies" />
        <p className="text-gray-400">Unable to load movies. Please try again later.</p>
      </div>
    );
  }
}

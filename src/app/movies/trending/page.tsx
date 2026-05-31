import { getTeluguTrendingMovies } from "@/services/telugu-movies";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Trending Telugu Movies - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

export default async function TrendingPage() {
  try {
    const movies = await getTeluguTrendingMovies(30);
    return (
      <div className="app-page-shell py-8">
        <SectionHeader title="Trending Telugu Movies" />
        <MovieGrid movies={movies} />
      </div>
    );
  } catch {
    return (
      <div className="app-page-shell py-8">
        <SectionHeader title="Trending Telugu Movies" />
        <p className="text-gray-400">Unable to load trending Telugu movies. Please try again later.</p>
      </div>
    );
  }
}

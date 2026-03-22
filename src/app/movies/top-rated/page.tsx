import { getTopRatedTeluguMovies } from "@/services/telugu-movies";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Top Rated Telugu Movies - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

export default async function TopRatedPage() {
  try {
    const movies = await getTopRatedTeluguMovies(30);
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Top Rated Telugu Movies" />
        <MovieGrid movies={movies} />
      </div>
    );
  } catch {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Top Rated Telugu Movies" />
        <p className="text-gray-400">Unable to load top-rated Telugu movies. Please try again later.</p>
      </div>
    );
  }
}

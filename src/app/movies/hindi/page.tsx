import { getHindiMovies } from "@/services/tmdb";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Hindi Movies - TCU" };
export const dynamic = "force-dynamic";

export default async function HindiMoviesPage() {
  try {
    const data = await getHindiMovies();
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Hindi / Bollywood Movies" />
        <MovieGrid movies={data.results} />
      </div>
    );
  } catch {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Hindi / Bollywood Movies" />
        <p className="text-gray-400">Unable to load movies. Please try again later.</p>
      </div>
    );
  }
}

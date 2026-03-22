import { getLatestTeluguReleases } from "@/services/telugu-movies";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Validated Telugu Releases - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

export default async function TrendingPage() {
  try {
    const movies = await getLatestTeluguReleases(30);
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Validated Telugu Releases" />
        <MovieGrid movies={movies} />
      </div>
    );
  } catch {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Validated Telugu Releases" />
        <p className="text-gray-400">Unable to load validated Telugu releases. Please try again later.</p>
      </div>
    );
  }
}

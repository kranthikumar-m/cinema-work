import { getLatestTeluguReleases } from "@/services/telugu-movies";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Latest Telugu Releases - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

export default async function NowPlayingPage() {
  try {
    const movies = await getLatestTeluguReleases(30);
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Latest Confirmed Telugu Releases" />
        <MovieGrid movies={movies} />
      </div>
    );
  } catch {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Latest Confirmed Telugu Releases" />
        <p className="text-gray-400">Unable to load the latest Telugu releases. Please try again later.</p>
      </div>
    );
  }
}

import { getNowPlaying } from "@/services/tmdb";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Now Playing - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

export default async function NowPlayingPage() {
  try {
    const data = await getNowPlaying();
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Now Playing in Theaters" />
        <MovieGrid movies={data.results} />
      </div>
    );
  } catch {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Now Playing in Theaters" />
        <p className="text-gray-400">Unable to load movies. Please try again later.</p>
      </div>
    );
  }
}

import { getTrending } from "@/services/tmdb";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Videos & Trailers - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

export default async function VideosPage() {
  try {
    const data = await getTrending("week");
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Latest Trailers & Videos" />
        <p className="text-gray-400 mb-6">
          Browse trending movies and watch their trailers on each movie&apos;s detail page.
        </p>
        <MovieGrid movies={data.results} />
      </div>
    );
  } catch {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Latest Trailers & Videos" />
        <p className="text-gray-400">Unable to load videos. Please try again later.</p>
      </div>
    );
  }
}

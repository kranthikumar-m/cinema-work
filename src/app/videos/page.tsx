import { getLatestTeluguReleases } from "@/services/telugu-movies";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Videos & Trailers - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

export default async function VideosPage() {
  try {
    const movies = await getLatestTeluguReleases(24);
    return (
      <div className="app-page-shell py-8">
        <SectionHeader title="Telugu Trailers & Videos" />
        <p className="text-gray-400 mb-6">
          Browse validated Telugu releases and open each movie page to watch available trailers.
        </p>
        <MovieGrid movies={movies} />
      </div>
    );
  } catch {
    return (
      <div className="app-page-shell py-8">
        <SectionHeader title="Telugu Trailers & Videos" />
        <p className="text-gray-400">Unable to load videos. Please try again later.</p>
      </div>
    );
  }
}

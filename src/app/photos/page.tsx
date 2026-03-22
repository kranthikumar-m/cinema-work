import { getPopular } from "@/services/tmdb";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Photos - TCU" };
export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  try {
    const data = await getPopular();
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Movie Photos & Galleries" />
        <p className="text-gray-400 mb-6">
          Explore photos from popular movies. Visit each movie&apos;s detail page for full galleries.
        </p>
        <MovieGrid movies={data.results} />
      </div>
    );
  } catch {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title="Movie Photos & Galleries" />
        <p className="text-gray-400">Unable to load photos. Please try again later.</p>
      </div>
    );
  }
}

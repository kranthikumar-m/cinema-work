import { getPopularTeluguMovies } from "@/services/telugu-movies";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Photos - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  try {
    const movies = await getPopularTeluguMovies(24);
    return (
      <div className="app-page-shell py-8">
        <SectionHeader title="Telugu Movie Photos & Galleries" />
        <p className="text-gray-400 mb-6">
          Explore stills from popular Telugu movies. Visit each movie&apos;s detail page for full galleries.
        </p>
        <MovieGrid movies={movies} />
      </div>
    );
  } catch {
    return (
      <div className="app-page-shell py-8">
        <SectionHeader title="Telugu Movie Photos & Galleries" />
        <p className="text-gray-400">Unable to load photos. Please try again later.</p>
      </div>
    );
  }
}

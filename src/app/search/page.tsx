import { searchMovies } from "@/services/tmdb";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Search } from "lucide-react";

export const metadata = { title: "Search - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: { q?: string };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q?.trim();

  if (!query) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-16 text-center">
        <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Search Movies</h2>
        <p className="text-gray-400">
          Use the search bar above to find movies.
        </p>
      </div>
    );
  }

  let data;
  try {
    data = await searchMovies(query);
  } catch {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title={`Search results for "${query}"`} />
        <p className="text-gray-400">Failed to search. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <SectionHeader
        title={`Search results for "${query}" (${data.total_results})`}
      />
      {data.results.length > 0 ? (
        <MovieGrid movies={data.results} />
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400">
            No movies found for &quot;{query}&quot;.
          </p>
        </div>
      )}
    </div>
  );
}

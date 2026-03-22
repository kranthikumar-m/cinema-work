import { getValidatedTeluguReleases } from "@/services/telugu-data";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Validated Telugu Releases - TCU" };
export const dynamic = "force-dynamic";

export default async function ValidatedTeluguPage() {
  const year = new Date().getFullYear();

  try {
    const { movies, validation } = await getValidatedTeluguReleases(year);

    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title={`Verified Telugu Releases ${year}`} />
        <p className="text-sm text-gray-400 mb-6">
          {validation.validated.length} movies verified against TMDB + Wikipedia
          {validation.tmdbOnly.length > 0 &&
            ` | ${validation.tmdbOnly.length} from TMDB only`}
        </p>

        {validation.validated.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">
              Wikipedia Verified
            </h3>
            <MovieGrid movies={validation.validated} />
          </>
        )}

        {validation.tmdbOnly.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-400 mb-4">
              TMDB Only (not yet in Wikipedia)
            </h3>
            <MovieGrid movies={validation.tmdbOnly} />
          </div>
        )}

        {movies.length === 0 && (
          <p className="text-gray-400">No validated Telugu releases found for {year}.</p>
        )}
      </div>
    );
  } catch {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <SectionHeader title={`Verified Telugu Releases ${year}`} />
        <p className="text-gray-400">Unable to load validated data. Please try again later.</p>
      </div>
    );
  }
}

import {
  getTeluguMovies,
  getHindiMovies,
  getTamilMovies,
  getUpcoming,
  getGenres,
} from "@/services/tmdb";
import {
  getLatestTeluguMovies,
  getUpcomingTeluguReleases,
} from "@/services/telugu-data";
import { HeroCarousel } from "@/components/movie/HeroCarousel";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { MovieListWidget } from "@/components/movie/SidebarWidgets";
import { FeaturedArticleCard } from "@/components/movie/FeaturedArticleCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { articles } from "@/data/editorial";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [teluguLatest, teluguUpcoming, teluguTMDB, hindi, tamil, upcoming, genreData] =
      await Promise.all([
        getLatestTeluguMovies(5),
        getUpcomingTeluguReleases(),
        getTeluguMovies(),
        getHindiMovies(),
        getTamilMovies(),
        getUpcoming(),
        getGenres(),
      ]);
    return {
      teluguLatest,
      teluguUpcoming,
      teluguTMDB,
      hindi,
      tamil,
      upcoming,
      genres: genreData.genres,
    };
  } catch (error) {
    console.error("Failed to load homepage data:", error);
    return null;
  }
}

export default async function HomePage() {
  const data = await getData();

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">
            Unable to load content
          </h2>
          <p className="text-gray-400">
            Please check that the TMDB_API_KEY environment variable is set
            correctly.
          </p>
        </div>
      </div>
    );
  }

  const { teluguLatest, teluguUpcoming, teluguTMDB, hindi, tamil, upcoming, genres } =
    data;

  // Telugu pipeline movies drive the hero; fall back to TMDB discover results.
  const heroMovies = teluguLatest.length > 0 ? teluguLatest : teluguTMDB.results;
  const latestGrid =
    teluguLatest.length > 0 ? teluguLatest : teluguTMDB.results;

  return (
    <div>
      <HeroCarousel movies={heroMovies} genres={genres} />

      <div className="mx-auto max-w-[1600px] px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1">
            {/* Telugu — primary focus */}
            <SectionHeader title="Latest Telugu Releases" href="/movies/telugu" />
            <MovieGrid
              movies={latestGrid.slice(0, 15)}
              columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            />

            {/* Upcoming Telugu */}
            {teluguUpcoming.length > 0 && (
              <div className="mt-12">
                <SectionHeader
                  title="Upcoming Telugu Movies"
                  href="/movies/telugu"
                />
                <MovieGrid
                  movies={teluguUpcoming.slice(0, 10)}
                  columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                />
              </div>
            )}

            {/* Latest Stories */}
            <div className="mt-12">
              <SectionHeader title="Latest Stories" href="/news" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {articles.slice(0, 3).map((article) => (
                  <FeaturedArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>

            {/* Hindi / Bollywood */}
            <div className="mt-12">
              <SectionHeader title="Hindi / Bollywood" href="/movies/hindi" />
              <MovieGrid
                movies={hindi.results.slice(0, 10)}
                columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              />
            </div>

            {/* Tamil / Kollywood */}
            <div className="mt-12">
              <SectionHeader title="Tamil / Kollywood" href="/movies/tamil" />
              <MovieGrid
                movies={tamil.results.slice(0, 10)}
                columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              />
            </div>
          </div>

          {/* Right sidebar — Telugu focused */}
          <div className="w-full flex-shrink-0 space-y-6 lg:w-80">
            <MovieListWidget
              title="Upcoming Telugu"
              movies={teluguUpcoming.length > 0 ? teluguUpcoming : upcoming.results}
              href="/movies/telugu"
            />
            <MovieListWidget
              title="More Telugu Releases"
              movies={latestGrid.slice(10)}
              href="/movies/telugu"
            />
            <MovieListWidget
              title="Upcoming (All India)"
              movies={upcoming.results}
              href="/movies/upcoming"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

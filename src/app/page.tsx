import { getTrending, getPopular, getUpcoming, getTopRated, getNowPlaying, getTeluguMovies, getHindiMovies, getTamilMovies, getGenres } from "@/services/tmdb";
import { HeroCarousel } from "@/components/movie/HeroCarousel";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { MovieListWidget } from "@/components/movie/SidebarWidgets";
import { FeaturedArticleCard } from "@/components/movie/FeaturedArticleCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { articles } from "@/data/editorial";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [trending, popular, upcoming, topRated, nowPlaying, telugu, hindi, tamil, genreData] =
      await Promise.all([
        getTrending("week"),
        getPopular(),
        getUpcoming(),
        getTopRated(),
        getNowPlaying(),
        getTeluguMovies(),
        getHindiMovies(),
        getTamilMovies(),
        getGenres(),
      ]);
    return { trending, popular, upcoming, topRated, nowPlaying, telugu, hindi, tamil, genres: genreData.genres };
  } catch (error) {
    console.error("Failed to load homepage data:", error);
    return null;
  }
}

export default async function HomePage() {
  const data = await getData();

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Unable to load content</h2>
          <p className="text-gray-400">
            Please check that the TMDB_API_KEY environment variable is set correctly.
          </p>
        </div>
      </div>
    );
  }

  const { trending, popular, upcoming, topRated, nowPlaying, telugu, hindi, tamil, genres } = data;

  return (
    <div>
      <HeroCarousel movies={trending.results} genres={genres} />

      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            {/* Telugu Movies */}
            <SectionHeader title="Latest Telugu Movies" href="/movies/telugu" />
            <MovieGrid
              movies={telugu.results.slice(0, 10)}
              columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            />

            {/* Hindi Movies */}
            <div className="mt-12">
              <SectionHeader title="Hindi / Bollywood" href="/movies/hindi" />
              <MovieGrid
                movies={hindi.results.slice(0, 10)}
                columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              />
            </div>

            {/* Tamil Movies */}
            <div className="mt-12">
              <SectionHeader title="Tamil / Kollywood" href="/movies/tamil" />
              <MovieGrid
                movies={tamil.results.slice(0, 10)}
                columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              />
            </div>

            {/* Latest Stories */}
            <div className="mt-12">
              <SectionHeader title="Latest Stories" href="/news" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.slice(0, 3).map((article) => (
                  <FeaturedArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>

            {/* Trending in India */}
            <div className="mt-12">
              <SectionHeader title="Trending in India" href="/movies/trending" />
              <MovieGrid
                movies={trending.results.slice(0, 10)}
                columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              />
            </div>

            {/* Now Playing */}
            <div className="mt-12">
              <SectionHeader title="Now Playing in Theaters" href="/movies/now-playing" />
              <MovieGrid
                movies={nowPlaying.results.slice(0, 10)}
                columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
            <MovieListWidget
              title="Upcoming Releases"
              movies={upcoming.results}
              href="/movies/upcoming"
            />
            <MovieListWidget
              title="Top Rated"
              movies={topRated.results}
              href="/movies/top-rated"
            />
            <MovieListWidget
              title="Popular Now"
              movies={popular.results.slice(5)}
              href="/movies/popular"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

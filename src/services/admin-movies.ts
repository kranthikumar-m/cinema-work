import { getMovieDetails, searchMovies } from "@/services/tmdb";
import { searchTeluguMovies } from "@/services/telugu-movies";
import { getMoviePosterUrl } from "@/lib/utils";
import type { AdminMovieSearchResult } from "@/types/admin";
import type { Movie } from "@/types/tmdb";

function mapMovieResult(movie: Movie): AdminMovieSearchResult {
  return {
    id: movie.id,
    title: movie.title,
    releaseDate: movie.release_date || "",
    originalLanguage: movie.original_language,
    posterUrl: getMoviePosterUrl(movie, "w300"),
    backdropPath: movie.backdrop_path ?? null,
    validationStatus: movie.validation?.status ?? "unknown",
  };
}

function sortAdminSearchResults(movies: Movie[]) {
  return [...movies].sort((a, b) => {
    const validatedScore =
      Number(b.validation?.status === "validated") -
      Number(a.validation?.status === "validated");

    if (validatedScore !== 0) {
      return validatedScore;
    }

    const teluguScore =
      Number(b.original_language === "te") - Number(a.original_language === "te");

    if (teluguScore !== 0) {
      return teluguScore;
    }

    const releaseScore = (b.release_date || "").localeCompare(a.release_date || "");

    if (releaseScore !== 0) {
      return releaseScore;
    }

    return b.popularity - a.popularity;
  });
}

export async function searchAdminMovies(query: string, limit = 10) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  if (/^\d+$/.test(trimmedQuery)) {
    const movie = await getMovieDetails(Number(trimmedQuery)).catch(() => null);
    return movie ? [mapMovieResult(movie)] : [];
  }

  const [teluguResponse, generalResponse] = await Promise.all([
    searchTeluguMovies(trimmedQuery, 1).catch(() => null),
    searchMovies(trimmedQuery, 1).catch(() => null),
  ]);

  const merged = new Map<number, Movie>();

  teluguResponse?.results.forEach((movie) => {
    merged.set(movie.id, movie);
  });

  generalResponse?.results.forEach((movie) => {
    if (!merged.has(movie.id)) {
      merged.set(movie.id, movie);
    }
  });

  return sortAdminSearchResults(Array.from(merged.values()))
    .slice(0, limit)
    .map(mapMovieResult);
}

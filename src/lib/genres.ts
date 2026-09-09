// TMDB movie genre ids → names. Static so list cards can label genres without
// an extra API call; the browse toolbar still uses the live `/genre/movie/list`.
export const TMDB_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export function genreNames(ids: number[] | undefined, limit = 3): string[] {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((id) => TMDB_GENRES[id])
    .filter((name): name is string => Boolean(name))
    .slice(0, limit);
}

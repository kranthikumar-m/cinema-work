export type MovieAssetSource = "tmdb" | "google_fallback" | "placeholder";

export interface MovieValidation {
  status: "validated" | "tmdb_only" | "excluded";
  reason?: string;
  matchedBy?: "exact" | "fuzzy";
  wikipediaTitle?: string;
  wikipediaPageTitle?: string;
  wikipediaReleaseDate?: string;
}

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  video: boolean;
  media_type?: string;
  poster_url?: string | null;
  backdrop_url?: string | null;
  asset_sources?: {
    poster: MovieAssetSource;
    backdrop: MovieAssetSource;
  };
  validation?: MovieValidation;
  // IMDb rating (0–10) and vote count, sourced from OMDb. `null` means no IMDb
  // rating is available (e.g. unreleased films) — the UI shows "NR" in that case.
  imdb_rating?: number | null;
  imdb_votes?: number | null;
  // Admin-curated alternate titles (e.g. an AndhraBoxOffice spelling), shown as
  // tags and usable for search.
  aliases?: string[];
}

export interface MovieDetails extends Movie {
  budget: number;
  revenue: number;
  runtime: number;
  status: string;
  tagline: string;
  homepage: string;
  imdb_id: string | null;
  genres: Genre[];
  production_companies: ProductionCompany[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; name: string; english_name: string }[];
  belongs_to_collection: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department: string;
  popularity: number;
  // TMDB gender: 0 = unknown, 1 = female, 2 = male. Used to split Actors/Actresses.
  gender?: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
  popularity: number;
  gender?: number;
  known_for_department?: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface MovieImage {
  aspect_ratio: number;
  height: number;
  width: number;
  file_path: string;
  vote_average: number;
  vote_count: number;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface WatchProviderResult {
  link: string;
  flatrate?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export interface Review {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
  url: string;
}

export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  birthday?: string;
  known_for?: Movie[];
}

export interface PersonExternalIds {
  imdb_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  facebook_id?: string | null;
}

export interface PersonImageProfile {
  file_path: string;
  aspect_ratio: number;
  height: number;
  width: number;
  vote_average: number;
}

// A person's individual movie credit (from /person/{id}/movie_credits).
export interface PersonMovieCredit {
  id: number;
  title: string;
  original_title: string;
  character?: string;
  job?: string;
  department?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  overview: string;
  genre_ids: number[];
  original_language: string;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  gender: number;
  also_known_as: string[];
  homepage: string | null;
  popularity: number;
  imdb_id?: string | null;
  external_ids?: PersonExternalIds;
  images?: { profiles: PersonImageProfile[] };
  movie_credits?: { cast: PersonMovieCredit[]; crew: PersonMovieCredit[] };
}

export type MovieCategory =
  | "trending"
  | "popular"
  | "top_rated"
  | "upcoming"
  | "now_playing"
  | "latest";

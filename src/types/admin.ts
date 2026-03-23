export const ADMIN_ROLES = ["admin", "editor", "viewer"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface AdminUser {
  id: number;
  email: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
}

export type AdminSessionUser = AdminUser;

export interface MovieBackdropOverrideRecord {
  movieId: number;
  selectedBackdropPath: string;
  source: "tmdb";
  selectedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MovieBackdropOption {
  filePath: string;
  width: number;
  height: number;
  voteAverage: number;
  voteCount: number;
  previewUrl: string;
  isSelected: boolean;
}

export interface MovieBackdropChoicesPayload {
  movieId: number;
  title: string;
  currentSource: "admin_override" | "tmdb_auto" | "movie_default" | "google_fallback";
  selectedBackdropPath: string | null;
  override: MovieBackdropOverrideRecord | null;
  overrideIsValid: boolean;
  images: MovieBackdropOption[];
}

export interface AdminMovieSearchResult {
  id: number;
  title: string;
  releaseDate: string;
  originalLanguage: string;
  posterUrl: string | null;
  backdropPath: string | null;
  validationStatus: "validated" | "tmdb_only" | "excluded" | "unknown";
}

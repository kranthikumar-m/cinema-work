import type { AuthUser, StoredUserRole } from "@/types/auth";

export const ADMIN_ROLES = ["admin", "editor"] as const;
export const MANAGEABLE_USER_ROLES = ["admin", "user"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type ManageableUserRole = (typeof MANAGEABLE_USER_ROLES)[number];

export type AdminUser = AuthUser;
export type AdminSessionUser = AuthUser;
export type AdminStoredUserRole = StoredUserRole;

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

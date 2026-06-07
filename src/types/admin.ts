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

export interface CustomImageRecord {
  id: number;
  movieId: number;
  imageType: "poster" | "backdrop";
  fileName: string;
  mimeType: string;
  uploadedByUserId: number | null;
  createdAt: string;
}

export interface ManualMovieRecord {
  movieId: number;
  tmdbTitle: string;
  releaseDate: string | null;
  addedByUserId: number | null;
  createdAt: string;
}

export interface MovieTrendingSignalRecord {
  movieId: number;
  mentionCount: number;
  mentionsUpdatedAt: string | null;
  adminOrder: number | null;
  adminPinned: boolean;
  updatedAt: string;
}

export interface AdminTrendingMovie {
  id: number;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
  releaseStatus: "released" | "upcoming";
  mentionCount: number;
  mentionsUpdatedAt: string | null;
  adminOrder: number | null;
}

export interface MovieCustomImagesPayload {
  movieId: number;
  title: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  hasTmdbPoster: boolean;
  hasTmdbBackdrop: boolean;
  customPoster: CustomImageRecord | null;
  customBackdrop: CustomImageRecord | null;
}

export type VideoCategory = "trailer" | "teaser" | "song" | "review" | "miscellaneous";

export interface MovieVideoRecord {
  id: number;
  movieId: number;
  youtubeKey: string;
  title: string;
  category: VideoCategory;
  addedByUserId: number | null;
  createdAt: string;
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
}

// Admin-editable movie detail overrides (Movie Facts + Company Credits).
export interface DetailFact {
  label: string;
  values: string[];
}

export interface DetailCompany {
  name: string;
  detail: string | null;
}

export interface MovieCompanyCredits {
  production: DetailCompany[];
  distributors: DetailCompany[];
  other: DetailCompany[];
}

export interface MovieDetailOverridePayload {
  facts: DetailFact[] | null;
  companies: MovieCompanyCredits | null;
}

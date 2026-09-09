import "server-only";
import fs from "node:fs";
import path from "node:path";
import { env } from "@/lib/env";
import type { StoredUserRole } from "@/types/auth";

type BetterSqlite3Database = {
  exec(sql: string): void;
  pragma(statement: string): void;
  prepare(sql: string): {
    get<T = unknown>(...params: unknown[]): T | undefined;
    all<T = unknown>(...params: unknown[]): T[];
    run(...params: unknown[]): { lastInsertRowid: number | bigint };
  };
};

declare function require(moduleName: string): unknown;

export interface DatabaseUserRow {
  id: number;
  name: string | null;
  email: string;
  password_hash: string;
  role: StoredUserRole;
  image: string | null;
  is_active: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSessionUserRow extends DatabaseUserRow {
  expires_at: string;
}

export interface DatabasePasswordResetTokenRow {
  id: number;
  user_id: number;
  expires_at: string;
  created_at: string;
  used_at: string | null;
}

export interface DatabaseBackdropOverrideRow {
  movie_id: number;
  selected_backdrop_path: string;
  source: "tmdb";
  selected_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCustomImageRow {
  id: number;
  movie_id: number;
  image_type: "poster" | "backdrop";
  file_name: string;
  mime_type: string;
  uploaded_by_user_id: number | null;
  created_at: string;
}

export interface DatabaseManualMovieRow {
  movie_id: number;
  tmdb_title: string;
  release_date: string | null;
  added_by_user_id: number | null;
  created_at: string;
}

export interface DatabaseMovieVideoRow {
  id: number;
  movie_id: number;
  youtube_key: string;
  title: string;
  category: string;
  added_by_user_id: number | null;
  created_at: string;
}

export interface DatabaseHiddenVideoRow {
  id: number;
  movie_id: number;
  youtube_key: string;
  created_at: string;
}

export interface DatabaseHiddenMovieRow {
  movie_id: number;
  added_by_user_id: number | null;
  created_at: string;
}

export interface DatabaseMovieReleaseOverrideRow {
  movie_id: number;
  release_date: string | null;
  aliases: string | null;
  added_by_user_id: number | null;
  updated_at: string;
}

export interface DatabaseMovieDetailOverrideRow {
  movie_id: number;
  facts: string | null;
  companies: string | null;
  added_by_user_id: number | null;
  updated_at: string;
}

export interface DatabaseSongSyncRow {
  movie_id: number;
  last_synced_at: string;
}

export interface DatabaseTrendingSignalRow {
  movie_id: number;
  mention_count: number;
  mentions_updated_at: string | null;
  admin_order: number | null;
  admin_pinned: number;
  updated_at: string;
}

export interface DatabaseValidatedYearMovieRow {
  year: number;
  movie_id: number;
  payload: string;
  created_at: string;
}

export interface DatabaseValidatedYearFreezeRow {
  year: number;
  frozen_at: string;
  movie_count: number;
}

export interface DatabaseValidatedYearProgressRow {
  year: number;
  quarter: number;
  movie_count: number;
  completed_at: string;
}

interface CreateUserRecordInput {
  name: string | null;
  email: string;
  passwordHash: string;
  role: StoredUserRole;
  isActive: boolean;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UpdateUserRecordInput {
  name?: string | null;
  email?: string;
  passwordHash?: string;
  role?: StoredUserRole;
  image?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  updatedAt: string;
}

interface CreateSessionRecordInput {
  userId: number;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}

interface CreatePasswordResetTokenRecordInput {
  userId: number;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}

interface UpsertBackdropOverrideRecordInput {
  movieId: number;
  selectedBackdropPath: string;
  source: "tmdb";
  selectedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface UpsertCustomImageRecordInput {
  movieId: number;
  imageType: "poster" | "backdrop";
  fileName: string;
  mimeType: string;
  uploadedByUserId: number | null;
  createdAt: string;
}

interface InsertManualMovieRecordInput {
  movieId: number;
  tmdbTitle: string;
  releaseDate: string | null;
  addedByUserId: number | null;
  createdAt: string;
}

interface InsertMovieVideoRecordInput {
  movieId: number;
  youtubeKey: string;
  title: string;
  category: string;
  addedByUserId: number | null;
  createdAt: string;
}

interface InsertHiddenVideoRecordInput {
  movieId: number;
  youtubeKey: string;
  createdAt: string;
}

interface InsertHiddenMovieRecordInput {
  movieId: number;
  addedByUserId: number | null;
  createdAt: string;
}

interface UpsertMovieReleaseOverrideInput {
  movieId: number;
  releaseDate: string | null;
  aliases: string[];
  addedByUserId: number | null;
  updatedAt: string;
}

interface UpsertMovieDetailOverrideInput {
  movieId: number;
  facts: string | null;
  companies: string | null;
  addedByUserId: number | null;
  updatedAt: string;
}

export type WatchStatus = "watched" | "want" | "no";
export type UserReviewStatus = "published" | "hidden";

export interface DatabaseUserRatingRow {
  user_id: number;
  movie_id: number;
  rating: number | null;
  watch_status: WatchStatus | null;
  updated_at: string;
}

export interface DatabaseUserReviewRow {
  id: number;
  user_id: number;
  movie_id: number;
  movie_title: string;
  author_name: string;
  title: string;
  body: string;
  rating: number | null;
  status: UserReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface DatabasePollRow {
  id: number;
  question: string;
  /** JSON array of option labels. */
  options: string;
  movie_id: number | null;
  movie_title: string | null;
  is_active: number;
  created_by_user_id: number | null;
  created_at: string;
}

export interface DatabasePollVoteRow {
  poll_id: number;
  voter_key: string;
  option_index: number;
  created_at: string;
}

export interface DatabaseQuizQuestionRow {
  id: number;
  question: string;
  /** JSON array of option labels. */
  options: string;
  correct_index: number;
  category: string;
  is_active: number;
  created_by_user_id: number | null;
  created_at: string;
}

export interface DatabaseQuizAnswerRow {
  question_id: number;
  voter_key: string;
  option_index: number;
  is_correct: number;
  created_at: string;
}

export interface DatabaseBoxOfficeRow {
  movie_id: number;
  movie_title: string;
  poster_path: string | null;
  release_date: string | null;
  worldwide_gross: string;
  note: string | null;
  as_of: string | null;
  added_by_user_id: number | null;
  updated_at: string;
}

interface UpsertUserRatingInput {
  userId: number;
  movieId: number;
  rating: number | null;
  watchStatus: WatchStatus | null;
  updatedAt: string;
}

interface UpsertUserReviewInput {
  userId: number;
  movieId: number;
  movieTitle: string;
  authorName: string;
  title: string;
  body: string;
  rating: number | null;
  status: UserReviewStatus;
  createdAt: string;
  updatedAt: string;
}

interface InsertPollInput {
  question: string;
  options: string[];
  movieId: number | null;
  movieTitle: string | null;
  isActive: boolean;
  createdByUserId: number | null;
  createdAt: string;
}

interface InsertQuizQuestionInput {
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  isActive: boolean;
  createdByUserId: number | null;
  createdAt: string;
}

interface UpsertBoxOfficeInput {
  movieId: number;
  movieTitle: string;
  posterPath: string | null;
  releaseDate: string | null;
  worldwideGross: string;
  note: string | null;
  asOf: string | null;
  addedByUserId: number | null;
  updatedAt: string;
}

interface StorageProvider {
  getUserByEmail(email: string): Promise<DatabaseUserRow | null>;
  getUserByIdentifier(identifier: string): Promise<DatabaseUserRow | null>;
  getUserById(userId: number): Promise<DatabaseUserRow | null>;
  listUsers(): Promise<DatabaseUserRow[]>;
  countUsers(): Promise<number>;
  countUsersByRole(role: StoredUserRole): Promise<number>;
  createUser(input: CreateUserRecordInput): Promise<DatabaseUserRow>;
  updateUser(userId: number, input: UpdateUserRecordInput): Promise<DatabaseUserRow | null>;
  deleteUser(userId: number): Promise<void>;
  deleteSessionsForUser(userId: number): Promise<void>;
  createSession(input: CreateSessionRecordInput): Promise<void>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;
  getSessionUserByTokenHash(tokenHash: string): Promise<DatabaseSessionUserRow | null>;
  deleteUsedOrExpiredPasswordResetTokens(nowIso: string): Promise<void>;
  createPasswordResetToken(input: CreatePasswordResetTokenRecordInput): Promise<void>;
  getPasswordResetTokenByHash(tokenHash: string): Promise<DatabasePasswordResetTokenRow | null>;
  markPasswordResetTokenUsed(id: number, usedAt: string): Promise<void>;
  getBackdropOverride(movieId: number): Promise<DatabaseBackdropOverrideRow | null>;
  upsertBackdropOverride(
    input: UpsertBackdropOverrideRecordInput
  ): Promise<DatabaseBackdropOverrideRow | null>;
  deleteBackdropOverride(movieId: number): Promise<void>;
  getCustomImage(movieId: number, imageType: "poster" | "backdrop"): Promise<DatabaseCustomImageRow | null>;
  getCustomImagesByMovieId(movieId: number): Promise<DatabaseCustomImageRow[]>;
  upsertCustomImage(input: UpsertCustomImageRecordInput): Promise<DatabaseCustomImageRow | null>;
  deleteCustomImage(movieId: number, imageType: "poster" | "backdrop"): Promise<void>;
  listManualMovies(): Promise<DatabaseManualMovieRow[]>;
  getManualMovie(movieId: number): Promise<DatabaseManualMovieRow | null>;
  insertManualMovie(input: InsertManualMovieRecordInput): Promise<DatabaseManualMovieRow | null>;
  deleteManualMovie(movieId: number): Promise<void>;
  listMovieVideos(movieId: number): Promise<DatabaseMovieVideoRow[]>;
  insertMovieVideo(input: InsertMovieVideoRecordInput): Promise<DatabaseMovieVideoRow | null>;
  deleteMovieVideo(id: number): Promise<void>;
  listHiddenVideos(movieId: number): Promise<DatabaseHiddenVideoRow[]>;
  insertHiddenVideo(input: InsertHiddenVideoRecordInput): Promise<void>;
  deleteHiddenVideo(movieId: number, youtubeKey: string): Promise<void>;
  listHiddenMovies(): Promise<DatabaseHiddenMovieRow[]>;
  insertHiddenMovie(input: InsertHiddenMovieRecordInput): Promise<void>;
  deleteHiddenMovie(movieId: number): Promise<void>;
  listMovieReleaseOverrides(): Promise<DatabaseMovieReleaseOverrideRow[]>;
  getMovieReleaseOverride(movieId: number): Promise<DatabaseMovieReleaseOverrideRow | null>;
  upsertMovieReleaseOverride(input: UpsertMovieReleaseOverrideInput): Promise<void>;
  deleteMovieReleaseOverride(movieId: number): Promise<void>;
  getMovieDetailOverride(movieId: number): Promise<DatabaseMovieDetailOverrideRow | null>;
  upsertMovieDetailOverride(input: UpsertMovieDetailOverrideInput): Promise<void>;
  deleteMovieDetailOverride(movieId: number): Promise<void>;
  getSongSync(movieId: number): Promise<DatabaseSongSyncRow | null>;
  upsertSongSync(movieId: number, syncedAt: string): Promise<void>;
  listTrendingSignals(): Promise<DatabaseTrendingSignalRow[]>;
  upsertMentionCount(movieId: number, mentionCount: number, updatedAt: string): Promise<void>;
  setAdminTrendingOrder(orderedMovieIds: number[], updatedAt: string): Promise<void>;
  clearAdminTrendingOrder(updatedAt: string): Promise<void>;
  listValidatedYearMovies(year: number): Promise<DatabaseValidatedYearMovieRow[]>;
  getValidatedYearFreeze(year: number): Promise<DatabaseValidatedYearFreezeRow | null>;
  appendValidatedYearMovies(input: {
    year: number;
    movies: { movieId: number; payload: string }[];
    createdAt: string;
  }): Promise<void>;
  listValidatedYearProgress(year: number): Promise<DatabaseValidatedYearProgressRow[]>;
  markValidatedYearQuarter(
    year: number,
    quarter: number,
    movieCount: number,
    completedAt: string
  ): Promise<void>;
  upsertValidatedYearFreeze(
    year: number,
    frozenAt: string,
    movieCount: number
  ): Promise<void>;
  // Community: ratings, reviews, polls, quiz, box office.
  getUserRating(userId: number, movieId: number): Promise<DatabaseUserRatingRow | null>;
  listUserRatingsForMovie(movieId: number): Promise<DatabaseUserRatingRow[]>;
  upsertUserRating(input: UpsertUserRatingInput): Promise<void>;
  listUserReviewsForMovie(movieId: number, includeHidden: boolean): Promise<DatabaseUserReviewRow[]>;
  listAllUserReviews(limit: number): Promise<DatabaseUserReviewRow[]>;
  getUserReview(userId: number, movieId: number): Promise<DatabaseUserReviewRow | null>;
  upsertUserReview(input: UpsertUserReviewInput): Promise<DatabaseUserReviewRow | null>;
  setUserReviewStatus(id: number, status: UserReviewStatus, updatedAt: string): Promise<void>;
  deleteUserReview(id: number): Promise<void>;
  listPolls(activeOnly: boolean): Promise<DatabasePollRow[]>;
  getPoll(id: number): Promise<DatabasePollRow | null>;
  insertPoll(input: InsertPollInput): Promise<DatabasePollRow | null>;
  setPollActive(id: number, isActive: boolean): Promise<void>;
  deletePoll(id: number): Promise<void>;
  listPollVotes(pollId: number): Promise<DatabasePollVoteRow[]>;
  upsertPollVote(pollId: number, voterKey: string, optionIndex: number, createdAt: string): Promise<void>;
  listQuizQuestions(activeOnly: boolean): Promise<DatabaseQuizQuestionRow[]>;
  getQuizQuestion(id: number): Promise<DatabaseQuizQuestionRow | null>;
  insertQuizQuestion(input: InsertQuizQuestionInput): Promise<DatabaseQuizQuestionRow | null>;
  setQuizQuestionActive(id: number, isActive: boolean): Promise<void>;
  deleteQuizQuestion(id: number): Promise<void>;
  listQuizAnswers(questionId: number): Promise<DatabaseQuizAnswerRow[]>;
  insertQuizAnswer(
    questionId: number,
    voterKey: string,
    optionIndex: number,
    isCorrect: boolean,
    createdAt: string
  ): Promise<void>;
  listBoxOffice(): Promise<DatabaseBoxOfficeRow[]>;
  getBoxOffice(movieId: number): Promise<DatabaseBoxOfficeRow | null>;
  upsertBoxOffice(input: UpsertBoxOfficeInput): Promise<void>;
  deleteBoxOffice(movieId: number): Promise<void>;
  clearValidatedYearFreeze(year: number): Promise<void>;
}

interface TableColumnInfo {
  name: string;
}

interface SupabaseErrorPayload {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
}

class SupabaseRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: string,
    readonly hint?: string
  ) {
    super(message);
    this.name = "SupabaseRequestError";
  }
}

let storageProvider: StorageProvider | null | undefined;

const USER_SELECT =
  "id,name,email,password_hash,role,image,is_active,last_login_at,created_at,updated_at";
const PASSWORD_RESET_TOKEN_SELECT = "id,user_id,expires_at,created_at,used_at";
const BACKDROP_OVERRIDE_SELECT =
  "movie_id,selected_backdrop_path,source,selected_by_user_id,created_at,updated_at";
const CUSTOM_IMAGE_SELECT =
  "id,movie_id,image_type,file_name,mime_type,uploaded_by_user_id,created_at";
const MANUAL_MOVIE_SELECT =
  "movie_id,tmdb_title,release_date,added_by_user_id,created_at";
const USER_RATING_SELECT = "user_id,movie_id,rating,watch_status,updated_at";
const USER_REVIEW_SELECT =
  "id,user_id,movie_id,movie_title,author_name,title,body,rating,status,created_at,updated_at";
const POLL_SELECT = "id,question,options,movie_id,movie_title,is_active,created_by_user_id,created_at";
const POLL_VOTE_SELECT = "poll_id,voter_key,option_index,created_at";
const QUIZ_SELECT = "id,question,options,correct_index,category,is_active,created_by_user_id,created_at";
const QUIZ_ANSWER_SELECT = "question_id,voter_key,option_index,is_correct,created_at";
const BOX_OFFICE_SELECT =
  "movie_id,movie_title,poster_path,release_date,worldwide_gross,note,as_of,added_by_user_id,updated_at";
const MOVIE_VIDEO_SELECT =
  "id,movie_id,youtube_key,title,category,added_by_user_id,created_at";
const HIDDEN_VIDEO_SELECT = "id,movie_id,youtube_key,created_at";
const HIDDEN_MOVIE_SELECT = "movie_id,added_by_user_id,created_at";
const RELEASE_OVERRIDE_SELECT =
  "movie_id,release_date,aliases,added_by_user_id,updated_at";
const DETAIL_OVERRIDE_SELECT =
  "movie_id,facts,companies,added_by_user_id,updated_at";
const TRENDING_SIGNAL_SELECT =
  "movie_id,mention_count,mentions_updated_at,admin_order,admin_pinned,updated_at";
const VALIDATED_YEAR_MOVIE_SELECT = "year,movie_id,payload,created_at";
const VALIDATED_YEAR_FREEZE_SELECT = "year,frozen_at,movie_count";
const VALIDATED_YEAR_PROGRESS_SELECT = "year,quarter,movie_count,completed_at";

function hasSupabaseProjectUrl(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeSupabaseProjectUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.search = "";
  url.hash = "";
  url.pathname = url.pathname.replace(/\/rest\/v1\/?$/, "");

  if (url.pathname === "/") {
    url.pathname = "";
  }

  return url.toString().replace(/\/$/, "");
}

function resolveDatabasePath(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(
      `Unsupported DATABASE_URL "${databaseUrl}". Use a file: URL for SQLite or your Supabase project URL, for example https://your-project-ref.supabase.co.`
    );
  }

  const rawPath = databaseUrl.slice("file:".length);

  if (!rawPath) {
    throw new Error("DATABASE_URL must include a file path after the file: prefix.");
  }

  return path.isAbsolute(rawPath)
    ? rawPath
    : path.join(process.cwd(), rawPath);
}

function initializeSqliteDatabase(database: BetterSqlite3Database) {
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
      image TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS movie_backdrop_overrides (
      movie_id INTEGER PRIMARY KEY,
      selected_backdrop_path TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'tmdb',
      selected_by_user_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (selected_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS movie_custom_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      image_type TEXT NOT NULL CHECK (image_type IN ('poster', 'backdrop')),
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      uploaded_by_user_id INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE(movie_id, image_type)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_custom_images_movie_id ON movie_custom_images(movie_id);

    CREATE TABLE IF NOT EXISTS movie_manual_additions (
      movie_id INTEGER PRIMARY KEY,
      tmdb_title TEXT NOT NULL,
      release_date TEXT,
      added_by_user_id INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS movie_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      youtube_key TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('trailer', 'teaser', 'song', 'lyrical', 'promo', 'interview', 'event', 'bts', 'review', 'miscellaneous')),
      added_by_user_id INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE(movie_id, youtube_key)
    );

    CREATE INDEX IF NOT EXISTS idx_movie_videos_movie_id ON movie_videos(movie_id);

    CREATE TABLE IF NOT EXISTS movie_hidden_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      youtube_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(movie_id, youtube_key)
    );

    CREATE INDEX IF NOT EXISTS idx_movie_hidden_videos_movie_id ON movie_hidden_videos(movie_id);

    CREATE TABLE IF NOT EXISTS hidden_movies (
      movie_id INTEGER PRIMARY KEY,
      added_by_user_id INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS movie_release_overrides (
      movie_id INTEGER PRIMARY KEY,
      release_date TEXT,
      aliases TEXT,
      added_by_user_id INTEGER,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS movie_detail_overrides (
      movie_id INTEGER PRIMARY KEY,
      facts TEXT,
      companies TEXT,
      added_by_user_id INTEGER,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS movie_song_syncs (
      movie_id INTEGER PRIMARY KEY,
      last_synced_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movie_trending_signals (
      movie_id INTEGER PRIMARY KEY,
      mention_count INTEGER NOT NULL DEFAULT 0,
      mentions_updated_at TEXT,
      admin_order INTEGER,
      admin_pinned INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS validated_year_movies (
      year INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (year, movie_id)
    );

    CREATE INDEX IF NOT EXISTS idx_validated_year_movies_year ON validated_year_movies(year);

    CREATE TABLE IF NOT EXISTS validated_year_freezes (
      year INTEGER PRIMARY KEY,
      frozen_at TEXT NOT NULL,
      movie_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS validated_year_progress (
      year INTEGER NOT NULL,
      quarter INTEGER NOT NULL,
      movie_count INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      PRIMARY KEY (year, quarter)
    );

    CREATE TABLE IF NOT EXISTS movie_user_ratings (
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
      watch_status TEXT CHECK (watch_status IS NULL OR watch_status IN ('watched', 'want', 'no')),
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, movie_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_movie_user_ratings_movie_id ON movie_user_ratings(movie_id);

    CREATE TABLE IF NOT EXISTS movie_user_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      movie_title TEXT NOT NULL,
      author_name TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
      status TEXT NOT NULL CHECK (status IN ('published', 'hidden')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, movie_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_movie_user_reviews_movie_id ON movie_user_reviews(movie_id);

    CREATE TABLE IF NOT EXISTS polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      movie_id INTEGER,
      movie_title TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS poll_votes (
      poll_id INTEGER NOT NULL,
      voter_key TEXT NOT NULL,
      option_index INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (poll_id, voter_key),
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_index INTEGER NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_answers (
      question_id INTEGER NOT NULL,
      voter_key TEXT NOT NULL,
      option_index INTEGER NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      PRIMARY KEY (question_id, voter_key),
      FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS movie_box_office (
      movie_id INTEGER PRIMARY KEY,
      movie_title TEXT NOT NULL,
      poster_path TEXT,
      release_date TEXT,
      worldwide_gross TEXT NOT NULL,
      note TEXT,
      as_of TEXT,
      added_by_user_id INTEGER,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  migrateMovieVideosTable(database);

  ensureColumn(database, "users", "name", "ALTER TABLE users ADD COLUMN name TEXT");
  ensureColumn(database, "users", "image", "ALTER TABLE users ADD COLUMN image TEXT");
  ensureColumn(
    database,
    "users",
    "is_active",
    "ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1"
  );
  ensureColumn(
    database,
    "users",
    "last_login_at",
    "ALTER TABLE users ADD COLUMN last_login_at TEXT"
  );
}

function migrateMovieVideosTable(database: BetterSqlite3Database) {
  try {
    database.prepare("INSERT INTO movie_videos (movie_id, youtube_key, title, category, created_at) VALUES (0, '__test__', '__test__', 'interview', '2000-01-01')").run();
    database.prepare("DELETE FROM movie_videos WHERE youtube_key = '__test__'").run();
  } catch {
    const rows = database.prepare("SELECT * FROM movie_videos").all();
    database.exec("DROP TABLE IF EXISTS movie_videos");
    database.exec(`
      CREATE TABLE movie_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id INTEGER NOT NULL,
        youtube_key TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('trailer', 'teaser', 'song', 'lyrical', 'promo', 'interview', 'event', 'bts', 'review', 'miscellaneous')),
        added_by_user_id INTEGER,
        created_at TEXT NOT NULL,
        FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(movie_id, youtube_key)
      );
      CREATE INDEX IF NOT EXISTS idx_movie_videos_movie_id ON movie_videos(movie_id);
    `);
    const insert = database.prepare(
      "INSERT OR IGNORE INTO movie_videos (movie_id, youtube_key, title, category, added_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const row of rows as DatabaseMovieVideoRow[]) {
      insert.run(row.movie_id, row.youtube_key, row.title, row.category, row.added_by_user_id, row.created_at);
    }
  }
}

function ensureColumn(
  database: BetterSqlite3Database,
  tableName: string,
  columnName: string,
  alterStatement: string
) {
  const columns =
    database
      .prepare(`PRAGMA table_info(${tableName})`)
      .all<TableColumnInfo>() ?? [];

  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  database.exec(alterStatement);
}

function isSupabaseUniqueEmailError(error: unknown) {
  return (
    error instanceof SupabaseRequestError &&
    error.code === "23505" &&
    `${error.message} ${error.details ?? ""}`.toLowerCase().includes("email")
  );
}

function buildSqliteUserPatch(input: UpdateUserRecordInput) {
  const assignments: string[] = [];
  const values: unknown[] = [];

  if ("name" in input) {
    assignments.push("name = ?");
    values.push(input.name ?? null);
  }

  if ("email" in input) {
    assignments.push("email = ?");
    values.push(input.email);
  }

  if ("passwordHash" in input) {
    assignments.push("password_hash = ?");
    values.push(input.passwordHash);
  }

  if ("role" in input) {
    assignments.push("role = ?");
    values.push(input.role);
  }

  if ("image" in input) {
    assignments.push("image = ?");
    values.push(input.image ?? null);
  }

  if ("isActive" in input) {
    assignments.push("is_active = ?");
    values.push(input.isActive ? 1 : 0);
  }

  if ("lastLoginAt" in input) {
    assignments.push("last_login_at = ?");
    values.push(input.lastLoginAt ?? null);
  }

  assignments.push("updated_at = ?");
  values.push(input.updatedAt);

  return { assignments, values };
}

function buildSupabaseUserPatch(input: UpdateUserRecordInput) {
  const patch: Record<string, string | number | null> = {
    updated_at: input.updatedAt,
  };

  if ("name" in input) {
    patch.name = input.name ?? null;
  }

  if ("email" in input) {
    patch.email = input.email ?? null;
  }

  if ("passwordHash" in input) {
    patch.password_hash = input.passwordHash ?? null;
  }

  if ("role" in input) {
    patch.role = input.role ?? null;
  }

  if ("image" in input) {
    patch.image = input.image ?? null;
  }

  if ("isActive" in input) {
    patch.is_active = input.isActive ? 1 : 0;
  }

  if ("lastLoginAt" in input) {
    patch.last_login_at = input.lastLoginAt ?? null;
  }

  return patch;
}

function createSqliteStorageProvider(databaseUrl: string): StorageProvider {
  const databasePath = resolveDatabasePath(databaseUrl);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const BetterSqlite3 = require("better-sqlite3") as {
    new (databasePath: string): BetterSqlite3Database;
  };
  const database = new BetterSqlite3(databasePath);
  initializeSqliteDatabase(database);

  return {
    async getUserByEmail(email) {
      return (
        database
          .prepare(
            `
              SELECT ${USER_SELECT}
              FROM users
              WHERE email = ?
            `
          )
          .get<DatabaseUserRow>(email.trim().toLowerCase()) ?? null
      );
    },
    async getUserByIdentifier(identifier) {
      const normalizedIdentifier = identifier.trim().toLowerCase();

      return (
        database
          .prepare(
            `
              SELECT ${USER_SELECT}
              FROM users
              WHERE LOWER(email) = ? OR LOWER(COALESCE(name, '')) = ?
              ORDER BY CASE WHEN LOWER(email) = ? THEN 0 ELSE 1 END
              LIMIT 1
            `
          )
          .get<DatabaseUserRow>(
            normalizedIdentifier,
            normalizedIdentifier,
            normalizedIdentifier
          ) ?? null
      );
    },
    async getUserById(userId) {
      return (
        database
          .prepare(
            `
              SELECT ${USER_SELECT}
              FROM users
              WHERE id = ?
            `
          )
          .get<DatabaseUserRow>(userId) ?? null
      );
    },
    async listUsers() {
      return database
        .prepare(
          `
            SELECT ${USER_SELECT}
            FROM users
            ORDER BY created_at DESC
          `
        )
        .all<DatabaseUserRow>();
    },
    async countUsers() {
      return (
        database
          .prepare("SELECT COUNT(*) as count FROM users")
          .get<{ count: number }>()?.count ?? 0
      );
    },
    async countUsersByRole(role) {
      return (
        database
          .prepare("SELECT COUNT(*) as count FROM users WHERE role = ?")
          .get<{ count: number }>(role)?.count ?? 0
      );
    },
    async createUser(input) {
      try {
        const result = database
          .prepare(
            `
              INSERT INTO users (
                name,
                email,
                password_hash,
                role,
                image,
                is_active,
                created_at,
                updated_at
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `
          )
          .run(
            input.name,
            input.email,
            input.passwordHash,
            input.role,
            input.image ?? null,
            input.isActive ? 1 : 0,
            input.createdAt,
            input.updatedAt
          );

        const created =
          database
            .prepare(
              `
                SELECT ${USER_SELECT}
                FROM users
                WHERE id = ?
              `
            )
            .get<DatabaseUserRow>(Number(result.lastInsertRowid)) ?? null;

        if (!created) {
          throw new Error("Unable to create user.");
        }

        return created;
      } catch (error) {
        if (
          error instanceof Error &&
          `${error.message}`.toLowerCase().includes("unique") &&
          `${error.message}`.toLowerCase().includes("email")
        ) {
          throw new Error("An account with that email already exists.");
        }

        throw error;
      }
    },
    async updateUser(userId, input) {
      const { assignments, values } = buildSqliteUserPatch(input);

      database
        .prepare(`UPDATE users SET ${assignments.join(", ")} WHERE id = ?`)
        .run(...values, userId);

      return (
        database
          .prepare(
            `
              SELECT ${USER_SELECT}
              FROM users
              WHERE id = ?
            `
          )
          .get<DatabaseUserRow>(userId) ?? null
      );
    },
    async deleteUser(userId) {
      database.prepare("DELETE FROM users WHERE id = ?").run(userId);
    },
    async deleteSessionsForUser(userId) {
      database.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    },
    async createSession(input) {
      database
        .prepare(
          `
            INSERT INTO sessions (user_id, token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?)
          `
        )
        .run(input.userId, input.tokenHash, input.expiresAt, input.createdAt);
    },
    async deleteSessionByTokenHash(tokenHash) {
      database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    },
    async getSessionUserByTokenHash(tokenHash) {
      return (
        database
          .prepare(
            `
              SELECT
                users.id,
                users.name,
                users.email,
                users.password_hash,
                users.role,
                users.image,
                users.is_active,
                users.last_login_at,
                users.created_at,
                users.updated_at,
                sessions.expires_at
              FROM sessions
              INNER JOIN users ON users.id = sessions.user_id
              WHERE sessions.token_hash = ?
            `
          )
          .get<DatabaseSessionUserRow>(tokenHash) ?? null
      );
    },
    async deleteUsedOrExpiredPasswordResetTokens(nowIso) {
      database
        .prepare(
          "DELETE FROM password_reset_tokens WHERE used_at IS NOT NULL OR expires_at <= ?"
        )
        .run(nowIso);
    },
    async createPasswordResetToken(input) {
      database
        .prepare(
          `
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?)
          `
        )
        .run(input.userId, input.tokenHash, input.expiresAt, input.createdAt);
    },
    async getPasswordResetTokenByHash(tokenHash) {
      return (
        database
          .prepare(
            `
              SELECT ${PASSWORD_RESET_TOKEN_SELECT}
              FROM password_reset_tokens
              WHERE token_hash = ?
            `
          )
          .get<DatabasePasswordResetTokenRow>(tokenHash) ?? null
      );
    },
    async markPasswordResetTokenUsed(id, usedAt) {
      database
        .prepare("UPDATE password_reset_tokens SET used_at = ? WHERE id = ?")
        .run(usedAt, id);
    },
    async getBackdropOverride(movieId) {
      return (
        database
          .prepare(
            `
              SELECT ${BACKDROP_OVERRIDE_SELECT}
              FROM movie_backdrop_overrides
              WHERE movie_id = ?
            `
          )
          .get<DatabaseBackdropOverrideRow>(movieId) ?? null
      );
    },
    async upsertBackdropOverride(input) {
      database
        .prepare(
          `
            INSERT INTO movie_backdrop_overrides (
              movie_id,
              selected_backdrop_path,
              source,
              selected_by_user_id,
              created_at,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(movie_id) DO UPDATE SET
              selected_backdrop_path = excluded.selected_backdrop_path,
              source = excluded.source,
              selected_by_user_id = excluded.selected_by_user_id,
              updated_at = excluded.updated_at
          `
        )
        .run(
          input.movieId,
          input.selectedBackdropPath,
          input.source,
          input.selectedByUserId,
          input.createdAt,
          input.updatedAt
        );

      return (
        database
          .prepare(
            `
              SELECT ${BACKDROP_OVERRIDE_SELECT}
              FROM movie_backdrop_overrides
              WHERE movie_id = ?
            `
          )
          .get<DatabaseBackdropOverrideRow>(input.movieId) ?? null
      );
    },
    async deleteBackdropOverride(movieId) {
      database
        .prepare("DELETE FROM movie_backdrop_overrides WHERE movie_id = ?")
        .run(movieId);
    },
    async getCustomImage(movieId, imageType) {
      return (
        database
          .prepare(
            `SELECT ${CUSTOM_IMAGE_SELECT} FROM movie_custom_images WHERE movie_id = ? AND image_type = ?`
          )
          .get<DatabaseCustomImageRow>(movieId, imageType) ?? null
      );
    },
    async getCustomImagesByMovieId(movieId) {
      return database
        .prepare(
          `SELECT ${CUSTOM_IMAGE_SELECT} FROM movie_custom_images WHERE movie_id = ?`
        )
        .all<DatabaseCustomImageRow>(movieId);
    },
    async upsertCustomImage(input) {
      database
        .prepare(
          `
            INSERT INTO movie_custom_images (movie_id, image_type, file_name, mime_type, uploaded_by_user_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(movie_id, image_type) DO UPDATE SET
              file_name = excluded.file_name,
              mime_type = excluded.mime_type,
              uploaded_by_user_id = excluded.uploaded_by_user_id,
              created_at = excluded.created_at
          `
        )
        .run(
          input.movieId,
          input.imageType,
          input.fileName,
          input.mimeType,
          input.uploadedByUserId,
          input.createdAt
        );

      return (
        database
          .prepare(
            `SELECT ${CUSTOM_IMAGE_SELECT} FROM movie_custom_images WHERE movie_id = ? AND image_type = ?`
          )
          .get<DatabaseCustomImageRow>(input.movieId, input.imageType) ?? null
      );
    },
    async deleteCustomImage(movieId, imageType) {
      database
        .prepare("DELETE FROM movie_custom_images WHERE movie_id = ? AND image_type = ?")
        .run(movieId, imageType);
    },
    async listManualMovies() {
      return database
        .prepare(`SELECT ${MANUAL_MOVIE_SELECT} FROM movie_manual_additions ORDER BY created_at DESC`)
        .all<DatabaseManualMovieRow>();
    },
    async getManualMovie(movieId) {
      return (
        database
          .prepare(`SELECT ${MANUAL_MOVIE_SELECT} FROM movie_manual_additions WHERE movie_id = ?`)
          .get<DatabaseManualMovieRow>(movieId) ?? null
      );
    },
    async insertManualMovie(input) {
      database
        .prepare(
          `INSERT OR IGNORE INTO movie_manual_additions (movie_id, tmdb_title, release_date, added_by_user_id, created_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(input.movieId, input.tmdbTitle, input.releaseDate, input.addedByUserId, input.createdAt);

      return (
        database
          .prepare(`SELECT ${MANUAL_MOVIE_SELECT} FROM movie_manual_additions WHERE movie_id = ?`)
          .get<DatabaseManualMovieRow>(input.movieId) ?? null
      );
    },
    async deleteManualMovie(movieId) {
      database.prepare("DELETE FROM movie_manual_additions WHERE movie_id = ?").run(movieId);
    },
    async listMovieVideos(movieId) {
      return database
        .prepare(`SELECT ${MOVIE_VIDEO_SELECT} FROM movie_videos WHERE movie_id = ? ORDER BY created_at ASC`)
        .all<DatabaseMovieVideoRow>(movieId);
    },
    async insertMovieVideo(input) {
      database
        .prepare(
          `INSERT OR IGNORE INTO movie_videos (movie_id, youtube_key, title, category, added_by_user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(input.movieId, input.youtubeKey, input.title, input.category, input.addedByUserId, input.createdAt);

      return (
        database
          .prepare(`SELECT ${MOVIE_VIDEO_SELECT} FROM movie_videos WHERE movie_id = ? AND youtube_key = ?`)
          .get<DatabaseMovieVideoRow>(input.movieId, input.youtubeKey) ?? null
      );
    },
    async deleteMovieVideo(id) {
      database.prepare("DELETE FROM movie_videos WHERE id = ?").run(id);
    },
    async listHiddenVideos(movieId) {
      return database
        .prepare(`SELECT ${HIDDEN_VIDEO_SELECT} FROM movie_hidden_videos WHERE movie_id = ?`)
        .all<DatabaseHiddenVideoRow>(movieId);
    },
    async insertHiddenVideo(input) {
      database
        .prepare(
          `INSERT OR IGNORE INTO movie_hidden_videos (movie_id, youtube_key, created_at)
           VALUES (?, ?, ?)`
        )
        .run(input.movieId, input.youtubeKey, input.createdAt);
    },
    async deleteHiddenVideo(movieId, youtubeKey) {
      database
        .prepare("DELETE FROM movie_hidden_videos WHERE movie_id = ? AND youtube_key = ?")
        .run(movieId, youtubeKey);
    },
    async listHiddenMovies() {
      return database
        .prepare(`SELECT ${HIDDEN_MOVIE_SELECT} FROM hidden_movies`)
        .all<DatabaseHiddenMovieRow>();
    },
    async insertHiddenMovie(input) {
      database
        .prepare(
          `INSERT OR IGNORE INTO hidden_movies (movie_id, added_by_user_id, created_at)
           VALUES (?, ?, ?)`
        )
        .run(input.movieId, input.addedByUserId, input.createdAt);
    },
    async deleteHiddenMovie(movieId) {
      database.prepare("DELETE FROM hidden_movies WHERE movie_id = ?").run(movieId);
    },
    async listMovieReleaseOverrides() {
      return database
        .prepare(`SELECT ${RELEASE_OVERRIDE_SELECT} FROM movie_release_overrides`)
        .all<DatabaseMovieReleaseOverrideRow>();
    },
    async getMovieReleaseOverride(movieId) {
      return (
        database
          .prepare(
            `SELECT ${RELEASE_OVERRIDE_SELECT} FROM movie_release_overrides WHERE movie_id = ?`
          )
          .get<DatabaseMovieReleaseOverrideRow>(movieId) ?? null
      );
    },
    async upsertMovieReleaseOverride(input) {
      database
        .prepare(
          `INSERT INTO movie_release_overrides (movie_id, release_date, aliases, added_by_user_id, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(movie_id) DO UPDATE SET
             release_date = excluded.release_date,
             aliases = excluded.aliases,
             added_by_user_id = excluded.added_by_user_id,
             updated_at = excluded.updated_at`
        )
        .run(
          input.movieId,
          input.releaseDate,
          JSON.stringify(input.aliases),
          input.addedByUserId,
          input.updatedAt
        );
    },
    async deleteMovieReleaseOverride(movieId) {
      database
        .prepare("DELETE FROM movie_release_overrides WHERE movie_id = ?")
        .run(movieId);
    },
    async getMovieDetailOverride(movieId) {
      return (
        database
          .prepare(
            `SELECT ${DETAIL_OVERRIDE_SELECT} FROM movie_detail_overrides WHERE movie_id = ?`
          )
          .get<DatabaseMovieDetailOverrideRow>(movieId) ?? null
      );
    },
    async upsertMovieDetailOverride(input) {
      database
        .prepare(
          `INSERT INTO movie_detail_overrides (movie_id, facts, companies, added_by_user_id, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(movie_id) DO UPDATE SET
             facts = excluded.facts,
             companies = excluded.companies,
             added_by_user_id = excluded.added_by_user_id,
             updated_at = excluded.updated_at`
        )
        .run(input.movieId, input.facts, input.companies, input.addedByUserId, input.updatedAt);
    },
    async deleteMovieDetailOverride(movieId) {
      database
        .prepare("DELETE FROM movie_detail_overrides WHERE movie_id = ?")
        .run(movieId);
    },
    async getSongSync(movieId) {
      return (
        database
          .prepare("SELECT movie_id, last_synced_at FROM movie_song_syncs WHERE movie_id = ?")
          .get<DatabaseSongSyncRow>(movieId) ?? null
      );
    },
    async upsertSongSync(movieId, syncedAt) {
      database
        .prepare(
          `INSERT INTO movie_song_syncs (movie_id, last_synced_at) VALUES (?, ?)
           ON CONFLICT(movie_id) DO UPDATE SET last_synced_at = excluded.last_synced_at`
        )
        .run(movieId, syncedAt);
    },
    async listTrendingSignals() {
      return database
        .prepare(`SELECT ${TRENDING_SIGNAL_SELECT} FROM movie_trending_signals`)
        .all<DatabaseTrendingSignalRow>();
    },
    async upsertMentionCount(movieId, mentionCount, updatedAt) {
      database
        .prepare(
          `INSERT INTO movie_trending_signals (movie_id, mention_count, mentions_updated_at, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(movie_id) DO UPDATE SET
             mention_count = excluded.mention_count,
             mentions_updated_at = excluded.mentions_updated_at,
             updated_at = excluded.updated_at`
        )
        .run(movieId, mentionCount, updatedAt, updatedAt);
    },
    async setAdminTrendingOrder(orderedMovieIds, updatedAt) {
      database
        .prepare(
          `UPDATE movie_trending_signals SET admin_order = NULL, admin_pinned = 0, updated_at = ?
           WHERE admin_pinned = 1`
        )
        .run(updatedAt);

      orderedMovieIds.forEach((movieId, index) => {
        database
          .prepare(
            `INSERT INTO movie_trending_signals (movie_id, admin_order, admin_pinned, updated_at)
             VALUES (?, ?, 1, ?)
             ON CONFLICT(movie_id) DO UPDATE SET
               admin_order = excluded.admin_order,
               admin_pinned = 1,
               updated_at = excluded.updated_at`
          )
          .run(movieId, index, updatedAt);
      });
    },
    async clearAdminTrendingOrder(updatedAt) {
      database
        .prepare(
          `UPDATE movie_trending_signals SET admin_order = NULL, admin_pinned = 0, updated_at = ?
           WHERE admin_pinned = 1`
        )
        .run(updatedAt);
    },
    async listValidatedYearMovies(year) {
      return database
        .prepare(
          `SELECT ${VALIDATED_YEAR_MOVIE_SELECT} FROM validated_year_movies WHERE year = ? ORDER BY movie_id ASC`
        )
        .all<DatabaseValidatedYearMovieRow>(year);
    },
    async getValidatedYearFreeze(year) {
      return (
        database
          .prepare(
            `SELECT ${VALIDATED_YEAR_FREEZE_SELECT} FROM validated_year_freezes WHERE year = ?`
          )
          .get<DatabaseValidatedYearFreezeRow>(year) ?? null
      );
    },
    async appendValidatedYearMovies(input) {
      const insert = database.prepare(
        `INSERT INTO validated_year_movies (year, movie_id, payload, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(year, movie_id) DO UPDATE SET payload = excluded.payload`
      );
      for (const movie of input.movies) {
        insert.run(input.year, movie.movieId, movie.payload, input.createdAt);
      }
    },
    async listValidatedYearProgress(year) {
      return database
        .prepare(
          `SELECT ${VALIDATED_YEAR_PROGRESS_SELECT} FROM validated_year_progress WHERE year = ?`
        )
        .all<DatabaseValidatedYearProgressRow>(year);
    },
    async markValidatedYearQuarter(year, quarter, movieCount, completedAt) {
      database
        .prepare(
          `INSERT INTO validated_year_progress (year, quarter, movie_count, completed_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(year, quarter) DO UPDATE SET
             movie_count = excluded.movie_count,
             completed_at = excluded.completed_at`
        )
        .run(year, quarter, movieCount, completedAt);
    },
    async upsertValidatedYearFreeze(year, frozenAt, movieCount) {
      database
        .prepare(
          `INSERT INTO validated_year_freezes (year, frozen_at, movie_count) VALUES (?, ?, ?)
           ON CONFLICT(year) DO UPDATE SET frozen_at = excluded.frozen_at, movie_count = excluded.movie_count`
        )
        .run(year, frozenAt, movieCount);
    },
    async clearValidatedYearFreeze(year) {
      database.prepare("DELETE FROM validated_year_freezes WHERE year = ?").run(year);
      database.prepare("DELETE FROM validated_year_progress WHERE year = ?").run(year);
      database.prepare("DELETE FROM validated_year_movies WHERE year = ?").run(year);
    },
    async getUserRating(userId, movieId) {
      return (
        database
          .prepare(`SELECT ${USER_RATING_SELECT} FROM movie_user_ratings WHERE user_id = ? AND movie_id = ?`)
          .get<DatabaseUserRatingRow>(userId, movieId) ?? null
      );
    },
    async listUserRatingsForMovie(movieId) {
      return database
        .prepare(`SELECT ${USER_RATING_SELECT} FROM movie_user_ratings WHERE movie_id = ?`)
        .all<DatabaseUserRatingRow>(movieId);
    },
    async upsertUserRating(input) {
      database
        .prepare(
          `INSERT INTO movie_user_ratings (user_id, movie_id, rating, watch_status, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id, movie_id) DO UPDATE SET
             rating = excluded.rating,
             watch_status = excluded.watch_status,
             updated_at = excluded.updated_at`
        )
        .run(input.userId, input.movieId, input.rating, input.watchStatus, input.updatedAt);
    },
    async listUserReviewsForMovie(movieId, includeHidden) {
      return database
        .prepare(
          `SELECT ${USER_REVIEW_SELECT} FROM movie_user_reviews
           WHERE movie_id = ? ${includeHidden ? "" : "AND status = 'published'"}
           ORDER BY created_at DESC`
        )
        .all<DatabaseUserReviewRow>(movieId);
    },
    async listAllUserReviews(limit) {
      return database
        .prepare(`SELECT ${USER_REVIEW_SELECT} FROM movie_user_reviews ORDER BY created_at DESC LIMIT ?`)
        .all<DatabaseUserReviewRow>(limit);
    },
    async getUserReview(userId, movieId) {
      return (
        database
          .prepare(`SELECT ${USER_REVIEW_SELECT} FROM movie_user_reviews WHERE user_id = ? AND movie_id = ?`)
          .get<DatabaseUserReviewRow>(userId, movieId) ?? null
      );
    },
    async upsertUserReview(input) {
      database
        .prepare(
          `INSERT INTO movie_user_reviews
             (user_id, movie_id, movie_title, author_name, title, body, rating, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id, movie_id) DO UPDATE SET
             movie_title = excluded.movie_title,
             author_name = excluded.author_name,
             title = excluded.title,
             body = excluded.body,
             rating = excluded.rating,
             status = excluded.status,
             updated_at = excluded.updated_at`
        )
        .run(
          input.userId,
          input.movieId,
          input.movieTitle,
          input.authorName,
          input.title,
          input.body,
          input.rating,
          input.status,
          input.createdAt,
          input.updatedAt
        );
      return (
        database
          .prepare(`SELECT ${USER_REVIEW_SELECT} FROM movie_user_reviews WHERE user_id = ? AND movie_id = ?`)
          .get<DatabaseUserReviewRow>(input.userId, input.movieId) ?? null
      );
    },
    async setUserReviewStatus(id, status, updatedAt) {
      database
        .prepare("UPDATE movie_user_reviews SET status = ?, updated_at = ? WHERE id = ?")
        .run(status, updatedAt, id);
    },
    async deleteUserReview(id) {
      database.prepare("DELETE FROM movie_user_reviews WHERE id = ?").run(id);
    },
    async listPolls(activeOnly) {
      return database
        .prepare(
          `SELECT ${POLL_SELECT} FROM polls ${activeOnly ? "WHERE is_active = 1" : ""} ORDER BY created_at DESC`
        )
        .all<DatabasePollRow>();
    },
    async getPoll(id) {
      return database.prepare(`SELECT ${POLL_SELECT} FROM polls WHERE id = ?`).get<DatabasePollRow>(id) ?? null;
    },
    async insertPoll(input) {
      const result = database
        .prepare(
          `INSERT INTO polls (question, options, movie_id, movie_title, is_active, created_by_user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          input.question,
          JSON.stringify(input.options),
          input.movieId,
          input.movieTitle,
          input.isActive ? 1 : 0,
          input.createdByUserId,
          input.createdAt
        );
      return (
        database
          .prepare(`SELECT ${POLL_SELECT} FROM polls WHERE id = ?`)
          .get<DatabasePollRow>(Number(result.lastInsertRowid)) ?? null
      );
    },
    async setPollActive(id, isActive) {
      database.prepare("UPDATE polls SET is_active = ? WHERE id = ?").run(isActive ? 1 : 0, id);
    },
    async deletePoll(id) {
      database.prepare("DELETE FROM poll_votes WHERE poll_id = ?").run(id);
      database.prepare("DELETE FROM polls WHERE id = ?").run(id);
    },
    async listPollVotes(pollId) {
      return database
        .prepare(`SELECT ${POLL_VOTE_SELECT} FROM poll_votes WHERE poll_id = ?`)
        .all<DatabasePollVoteRow>(pollId);
    },
    async upsertPollVote(pollId, voterKey, optionIndex, createdAt) {
      database
        .prepare(
          `INSERT INTO poll_votes (poll_id, voter_key, option_index, created_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(poll_id, voter_key) DO UPDATE SET option_index = excluded.option_index`
        )
        .run(pollId, voterKey, optionIndex, createdAt);
    },
    async listQuizQuestions(activeOnly) {
      return database
        .prepare(
          `SELECT ${QUIZ_SELECT} FROM quiz_questions ${activeOnly ? "WHERE is_active = 1" : ""} ORDER BY created_at DESC`
        )
        .all<DatabaseQuizQuestionRow>();
    },
    async getQuizQuestion(id) {
      return (
        database.prepare(`SELECT ${QUIZ_SELECT} FROM quiz_questions WHERE id = ?`).get<DatabaseQuizQuestionRow>(id) ??
        null
      );
    },
    async insertQuizQuestion(input) {
      const result = database
        .prepare(
          `INSERT INTO quiz_questions (question, options, correct_index, category, is_active, created_by_user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          input.question,
          JSON.stringify(input.options),
          input.correctIndex,
          input.category,
          input.isActive ? 1 : 0,
          input.createdByUserId,
          input.createdAt
        );
      return (
        database
          .prepare(`SELECT ${QUIZ_SELECT} FROM quiz_questions WHERE id = ?`)
          .get<DatabaseQuizQuestionRow>(Number(result.lastInsertRowid)) ?? null
      );
    },
    async setQuizQuestionActive(id, isActive) {
      database.prepare("UPDATE quiz_questions SET is_active = ? WHERE id = ?").run(isActive ? 1 : 0, id);
    },
    async deleteQuizQuestion(id) {
      database.prepare("DELETE FROM quiz_answers WHERE question_id = ?").run(id);
      database.prepare("DELETE FROM quiz_questions WHERE id = ?").run(id);
    },
    async listQuizAnswers(questionId) {
      return database
        .prepare(`SELECT ${QUIZ_ANSWER_SELECT} FROM quiz_answers WHERE question_id = ?`)
        .all<DatabaseQuizAnswerRow>(questionId);
    },
    async insertQuizAnswer(questionId, voterKey, optionIndex, isCorrect, createdAt) {
      database
        .prepare(
          `INSERT OR IGNORE INTO quiz_answers (question_id, voter_key, option_index, is_correct, created_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(questionId, voterKey, optionIndex, isCorrect ? 1 : 0, createdAt);
    },
    async listBoxOffice() {
      return database
        .prepare(`SELECT ${BOX_OFFICE_SELECT} FROM movie_box_office ORDER BY updated_at DESC`)
        .all<DatabaseBoxOfficeRow>();
    },
    async getBoxOffice(movieId) {
      return (
        database
          .prepare(`SELECT ${BOX_OFFICE_SELECT} FROM movie_box_office WHERE movie_id = ?`)
          .get<DatabaseBoxOfficeRow>(movieId) ?? null
      );
    },
    async upsertBoxOffice(input) {
      database
        .prepare(
          `INSERT INTO movie_box_office
             (movie_id, movie_title, poster_path, release_date, worldwide_gross, note, as_of, added_by_user_id, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(movie_id) DO UPDATE SET
             movie_title = excluded.movie_title,
             poster_path = excluded.poster_path,
             release_date = excluded.release_date,
             worldwide_gross = excluded.worldwide_gross,
             note = excluded.note,
             as_of = excluded.as_of,
             added_by_user_id = excluded.added_by_user_id,
             updated_at = excluded.updated_at`
        )
        .run(
          input.movieId,
          input.movieTitle,
          input.posterPath,
          input.releaseDate,
          input.worldwideGross,
          input.note,
          input.asOf,
          input.addedByUserId,
          input.updatedAt
        );
    },
    async deleteBoxOffice(movieId) {
      database.prepare("DELETE FROM movie_box_office WHERE movie_id = ?").run(movieId);
    },
  };
}

function createSupabaseStorageProvider(databaseUrl: string): StorageProvider {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required when DATABASE_URL is set to a Supabase project URL."
    );
  }

  const baseUrl = normalizeSupabaseProjectUrl(databaseUrl);
  const apiKey = env.SUPABASE_SERVICE_ROLE_KEY;

  async function request<T>(
    tableName: string,
    options?: {
      method?: "GET" | "POST" | "PATCH" | "DELETE";
      query?: Record<string, string | number | undefined>;
      body?: unknown;
      prefer?: string[];
    }
  ) {
    const url = new URL(`/rest/v1/${tableName}`, `${baseUrl}/`);

    for (const [key, value] of Object.entries(options?.query ?? {})) {
      if (value === undefined) {
        continue;
      }

      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url, {
      method: options?.method ?? "GET",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(options?.prefer?.length
          ? {
              Prefer: options.prefer.join(","),
            }
          : {}),
      },
      body: options?.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });

    const text = await response.text();
    const payload = text
      ? (() => {
          try {
            return JSON.parse(text) as unknown;
          } catch {
            return text;
          }
        })()
      : null;

    if (!response.ok) {
      const errorPayload =
        payload && typeof payload === "object"
          ? (payload as SupabaseErrorPayload)
          : undefined;
      const isMissingRelation = errorPayload?.code === "PGRST205";

      throw new SupabaseRequestError(
        isMissingRelation
          ? "Supabase storage tables are missing. Run supabase/schema.sql in the Supabase SQL editor, then redeploy."
          : errorPayload?.message ||
              `Supabase request to ${tableName} failed with status ${response.status}.`,
        response.status,
        errorPayload?.code,
        errorPayload?.details,
        errorPayload?.hint
      );
    }

    return payload as T;
  }

  async function selectRows<T>(
    tableName: string,
    query: Record<string, string | number | undefined>
  ) {
    return (await request<T[]>(tableName, { query })) ?? [];
  }

  async function selectSingleRow<T>(
    tableName: string,
    query: Record<string, string | number | undefined>
  ) {
    const rows = await selectRows<T>(tableName, {
      ...query,
      limit: 1,
    });

    return rows[0] ?? null;
  }

  return {
    async getUserByEmail(email) {
      return selectSingleRow<DatabaseUserRow>("users", {
        select: USER_SELECT,
        email: `eq.${email.trim().toLowerCase()}`,
      });
    },
    async getUserByIdentifier(identifier) {
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const emailMatch = await selectSingleRow<DatabaseUserRow>("users", {
        select: USER_SELECT,
        email: `eq.${normalizedIdentifier}`,
      });

      if (emailMatch) {
        return emailMatch;
      }

      const nameMatches = await selectRows<DatabaseUserRow>("users", {
        select: USER_SELECT,
        name: `ilike.${normalizedIdentifier}`,
      });

      return (
        nameMatches.find(
          (row) => (row.name?.trim().toLowerCase() ?? "") === normalizedIdentifier
        ) ?? null
      );
    },
    async getUserById(userId) {
      return selectSingleRow<DatabaseUserRow>("users", {
        select: USER_SELECT,
        id: `eq.${userId}`,
      });
    },
    async listUsers() {
      return selectRows<DatabaseUserRow>("users", {
        select: USER_SELECT,
        order: "created_at.desc",
      });
    },
    async countUsers() {
      const rows = await selectRows<{ id: number }>("users", {
        select: "id",
      });

      return rows.length;
    },
    async countUsersByRole(role) {
      const rows = await selectRows<{ id: number }>("users", {
        select: "id",
        role: `eq.${role}`,
      });

      return rows.length;
    },
    async createUser(input) {
      try {
        const rows = await request<DatabaseUserRow[]>("users", {
          method: "POST",
          query: {
            select: USER_SELECT,
          },
          body: {
            name: input.name,
            email: input.email,
            password_hash: input.passwordHash,
            role: input.role,
            image: input.image ?? null,
            is_active: input.isActive ? 1 : 0,
            created_at: input.createdAt,
            updated_at: input.updatedAt,
          },
          prefer: ["return=representation"],
        });

        const created = rows?.[0];

        if (!created) {
          throw new Error("Unable to create user.");
        }

        return created;
      } catch (error) {
        if (isSupabaseUniqueEmailError(error)) {
          throw new Error("An account with that email already exists.");
        }

        throw error;
      }
    },
    async updateUser(userId, input) {
      const rows = await request<DatabaseUserRow[]>("users", {
        method: "PATCH",
        query: {
          id: `eq.${userId}`,
          select: USER_SELECT,
        },
        body: buildSupabaseUserPatch(input),
        prefer: ["return=representation"],
      });

      return rows?.[0] ?? null;
    },
    async deleteUser(userId) {
      await request("users", {
        method: "DELETE",
        query: {
          id: `eq.${userId}`,
        },
      });
    },
    async deleteSessionsForUser(userId) {
      await request("sessions", {
        method: "DELETE",
        query: {
          user_id: `eq.${userId}`,
        },
      });
    },
    async createSession(input) {
      await request("sessions", {
        method: "POST",
        body: {
          user_id: input.userId,
          token_hash: input.tokenHash,
          expires_at: input.expiresAt,
          created_at: input.createdAt,
        },
      });
    },
    async deleteSessionByTokenHash(tokenHash) {
      await request("sessions", {
        method: "DELETE",
        query: {
          token_hash: `eq.${tokenHash}`,
        },
      });
    },
    async getSessionUserByTokenHash(tokenHash) {
      const session = await selectSingleRow<{
        user_id: number;
        expires_at: string;
      }>("sessions", {
        select: "user_id,expires_at",
        token_hash: `eq.${tokenHash}`,
      });

      if (!session) {
        return null;
      }

      const user = await selectSingleRow<DatabaseUserRow>("users", {
        select: USER_SELECT,
        id: `eq.${session.user_id}`,
      });

      if (!user) {
        return null;
      }

      return {
        ...user,
        expires_at: session.expires_at,
      };
    },
    async deleteUsedOrExpiredPasswordResetTokens(nowIso) {
      const tokens = await selectRows<DatabasePasswordResetTokenRow>("password_reset_tokens", {
        select: PASSWORD_RESET_TOKEN_SELECT,
      });

      const staleTokenIds = tokens
        .filter((token) => token.used_at !== null || token.expires_at <= nowIso)
        .map((token) => token.id);

      await Promise.all(
        staleTokenIds.map((id) =>
          request("password_reset_tokens", {
            method: "DELETE",
            query: {
              id: `eq.${id}`,
            },
          })
        )
      );
    },
    async createPasswordResetToken(input) {
      await request("password_reset_tokens", {
        method: "POST",
        body: {
          user_id: input.userId,
          token_hash: input.tokenHash,
          expires_at: input.expiresAt,
          created_at: input.createdAt,
        },
      });
    },
    async getPasswordResetTokenByHash(tokenHash) {
      return selectSingleRow<DatabasePasswordResetTokenRow>("password_reset_tokens", {
        select: PASSWORD_RESET_TOKEN_SELECT,
        token_hash: `eq.${tokenHash}`,
      });
    },
    async markPasswordResetTokenUsed(id, usedAt) {
      await request("password_reset_tokens", {
        method: "PATCH",
        query: {
          id: `eq.${id}`,
        },
        body: {
          used_at: usedAt,
        },
      });
    },
    async getBackdropOverride(movieId) {
      return selectSingleRow<DatabaseBackdropOverrideRow>("movie_backdrop_overrides", {
        select: BACKDROP_OVERRIDE_SELECT,
        movie_id: `eq.${movieId}`,
      });
    },
    async upsertBackdropOverride(input) {
      const rows = await request<DatabaseBackdropOverrideRow[]>("movie_backdrop_overrides", {
        method: "POST",
        query: {
          on_conflict: "movie_id",
          select: BACKDROP_OVERRIDE_SELECT,
        },
        body: {
          movie_id: input.movieId,
          selected_backdrop_path: input.selectedBackdropPath,
          source: input.source,
          selected_by_user_id: input.selectedByUserId,
          created_at: input.createdAt,
          updated_at: input.updatedAt,
        },
        prefer: ["resolution=merge-duplicates", "return=representation"],
      });

      return rows?.[0] ?? null;
    },
    async deleteBackdropOverride(movieId) {
      await request("movie_backdrop_overrides", {
        method: "DELETE",
        query: {
          movie_id: `eq.${movieId}`,
        },
      });
    },
    async getCustomImage(movieId, imageType) {
      return selectSingleRow<DatabaseCustomImageRow>("movie_custom_images", {
        select: CUSTOM_IMAGE_SELECT,
        movie_id: `eq.${movieId}`,
        image_type: `eq.${imageType}`,
      });
    },
    async getCustomImagesByMovieId(movieId) {
      return selectRows<DatabaseCustomImageRow>("movie_custom_images", {
        select: CUSTOM_IMAGE_SELECT,
        movie_id: `eq.${movieId}`,
      });
    },
    async upsertCustomImage(input) {
      const rows = await request<DatabaseCustomImageRow[]>("movie_custom_images", {
        method: "POST",
        query: {
          on_conflict: "movie_id,image_type",
          select: CUSTOM_IMAGE_SELECT,
        },
        body: {
          movie_id: input.movieId,
          image_type: input.imageType,
          file_name: input.fileName,
          mime_type: input.mimeType,
          uploaded_by_user_id: input.uploadedByUserId,
          created_at: input.createdAt,
        },
        prefer: ["resolution=merge-duplicates", "return=representation"],
      });

      return rows?.[0] ?? null;
    },
    async deleteCustomImage(movieId, imageType) {
      await request("movie_custom_images", {
        method: "DELETE",
        query: {
          movie_id: `eq.${movieId}`,
          image_type: `eq.${imageType}`,
        },
      });
    },
    async listManualMovies() {
      return selectRows<DatabaseManualMovieRow>("movie_manual_additions", {
        select: MANUAL_MOVIE_SELECT,
        order: "created_at.desc",
      });
    },
    async getManualMovie(movieId) {
      return selectSingleRow<DatabaseManualMovieRow>("movie_manual_additions", {
        select: MANUAL_MOVIE_SELECT,
        movie_id: `eq.${movieId}`,
      });
    },
    async insertManualMovie(input) {
      const rows = await request<DatabaseManualMovieRow[]>("movie_manual_additions", {
        method: "POST",
        query: { on_conflict: "movie_id", select: MANUAL_MOVIE_SELECT },
        body: {
          movie_id: input.movieId,
          tmdb_title: input.tmdbTitle,
          release_date: input.releaseDate,
          added_by_user_id: input.addedByUserId,
          created_at: input.createdAt,
        },
        prefer: ["resolution=merge-duplicates", "return=representation"],
      });
      return rows?.[0] ?? null;
    },
    async deleteManualMovie(movieId) {
      await request("movie_manual_additions", {
        method: "DELETE",
        query: { movie_id: `eq.${movieId}` },
      });
    },
    async listMovieVideos(movieId) {
      return selectRows<DatabaseMovieVideoRow>("movie_videos", {
        select: MOVIE_VIDEO_SELECT,
        movie_id: `eq.${movieId}`,
        order: "created_at.asc",
      });
    },
    async insertMovieVideo(input) {
      const rows = await request<DatabaseMovieVideoRow[]>("movie_videos", {
        method: "POST",
        query: { on_conflict: "movie_id,youtube_key", select: MOVIE_VIDEO_SELECT },
        body: {
          movie_id: input.movieId,
          youtube_key: input.youtubeKey,
          title: input.title,
          category: input.category,
          added_by_user_id: input.addedByUserId,
          created_at: input.createdAt,
        },
        prefer: ["resolution=merge-duplicates", "return=representation"],
      });
      return rows?.[0] ?? null;
    },
    async deleteMovieVideo(id) {
      await request("movie_videos", {
        method: "DELETE",
        query: { id: `eq.${id}` },
      });
    },
    async listHiddenVideos(movieId) {
      return selectRows<DatabaseHiddenVideoRow>("movie_hidden_videos", {
        select: HIDDEN_VIDEO_SELECT,
        movie_id: `eq.${movieId}`,
      });
    },
    async insertHiddenVideo(input) {
      await request("movie_hidden_videos", {
        method: "POST",
        query: { on_conflict: "movie_id,youtube_key" },
        body: {
          movie_id: input.movieId,
          youtube_key: input.youtubeKey,
          created_at: input.createdAt,
        },
        prefer: ["resolution=merge-duplicates"],
      });
    },
    async deleteHiddenVideo(movieId, youtubeKey) {
      await request("movie_hidden_videos", {
        method: "DELETE",
        query: { movie_id: `eq.${movieId}`, youtube_key: `eq.${youtubeKey}` },
      });
    },
    async listHiddenMovies() {
      return selectRows<DatabaseHiddenMovieRow>("hidden_movies", {
        select: HIDDEN_MOVIE_SELECT,
      });
    },
    async insertHiddenMovie(input) {
      await request("hidden_movies", {
        method: "POST",
        query: { on_conflict: "movie_id" },
        body: {
          movie_id: input.movieId,
          added_by_user_id: input.addedByUserId,
          created_at: input.createdAt,
        },
        prefer: ["resolution=merge-duplicates"],
      });
    },
    async deleteHiddenMovie(movieId) {
      await request("hidden_movies", {
        method: "DELETE",
        query: { movie_id: `eq.${movieId}` },
      });
    },
    async listMovieReleaseOverrides() {
      return selectRows<DatabaseMovieReleaseOverrideRow>("movie_release_overrides", {
        select: RELEASE_OVERRIDE_SELECT,
      });
    },
    async getMovieReleaseOverride(movieId) {
      return selectSingleRow<DatabaseMovieReleaseOverrideRow>("movie_release_overrides", {
        select: RELEASE_OVERRIDE_SELECT,
        movie_id: `eq.${movieId}`,
      });
    },
    async upsertMovieReleaseOverride(input) {
      await request("movie_release_overrides", {
        method: "POST",
        query: { on_conflict: "movie_id" },
        body: {
          movie_id: input.movieId,
          release_date: input.releaseDate,
          aliases: JSON.stringify(input.aliases),
          added_by_user_id: input.addedByUserId,
          updated_at: input.updatedAt,
        },
        prefer: ["resolution=merge-duplicates"],
      });
    },
    async deleteMovieReleaseOverride(movieId) {
      await request("movie_release_overrides", {
        method: "DELETE",
        query: { movie_id: `eq.${movieId}` },
      });
    },
    async getMovieDetailOverride(movieId) {
      return selectSingleRow<DatabaseMovieDetailOverrideRow>("movie_detail_overrides", {
        select: DETAIL_OVERRIDE_SELECT,
        movie_id: `eq.${movieId}`,
      });
    },
    async upsertMovieDetailOverride(input) {
      await request("movie_detail_overrides", {
        method: "POST",
        query: { on_conflict: "movie_id" },
        body: {
          movie_id: input.movieId,
          facts: input.facts,
          companies: input.companies,
          added_by_user_id: input.addedByUserId,
          updated_at: input.updatedAt,
        },
        prefer: ["resolution=merge-duplicates"],
      });
    },
    async deleteMovieDetailOverride(movieId) {
      await request("movie_detail_overrides", {
        method: "DELETE",
        query: { movie_id: `eq.${movieId}` },
      });
    },
    async getSongSync(movieId) {
      return selectSingleRow<DatabaseSongSyncRow>("movie_song_syncs", {
        select: "movie_id,last_synced_at",
        movie_id: `eq.${movieId}`,
      });
    },
    async upsertSongSync(movieId, syncedAt) {
      await request("movie_song_syncs", {
        method: "POST",
        query: { on_conflict: "movie_id" },
        body: { movie_id: movieId, last_synced_at: syncedAt },
        prefer: ["resolution=merge-duplicates"],
      });
    },
    async listTrendingSignals() {
      return selectRows<DatabaseTrendingSignalRow>("movie_trending_signals", {
        select: TRENDING_SIGNAL_SELECT,
      });
    },
    async upsertMentionCount(movieId, mentionCount, updatedAt) {
      await request("movie_trending_signals", {
        method: "POST",
        query: { on_conflict: "movie_id" },
        body: {
          movie_id: movieId,
          mention_count: mentionCount,
          mentions_updated_at: updatedAt,
          updated_at: updatedAt,
        },
        prefer: ["resolution=merge-duplicates"],
      });
    },
    async setAdminTrendingOrder(orderedMovieIds, updatedAt) {
      // Clear any existing pins first so removed movies revert to automatic order.
      await request("movie_trending_signals", {
        method: "PATCH",
        query: { admin_pinned: "eq.1" },
        body: { admin_order: null, admin_pinned: 0, updated_at: updatedAt },
      });

      for (let index = 0; index < orderedMovieIds.length; index += 1) {
        await request("movie_trending_signals", {
          method: "POST",
          query: { on_conflict: "movie_id" },
          body: {
            movie_id: orderedMovieIds[index],
            admin_order: index,
            admin_pinned: 1,
            updated_at: updatedAt,
          },
          prefer: ["resolution=merge-duplicates"],
        });
      }
    },
    async clearAdminTrendingOrder(updatedAt) {
      await request("movie_trending_signals", {
        method: "PATCH",
        query: { admin_pinned: "eq.1" },
        body: { admin_order: null, admin_pinned: 0, updated_at: updatedAt },
      });
    },
    async listValidatedYearMovies(year) {
      return selectRows<DatabaseValidatedYearMovieRow>("validated_year_movies", {
        select: VALIDATED_YEAR_MOVIE_SELECT,
        year: `eq.${year}`,
        order: "movie_id.asc",
      });
    },
    async getValidatedYearFreeze(year) {
      return selectSingleRow<DatabaseValidatedYearFreezeRow>("validated_year_freezes", {
        select: VALIDATED_YEAR_FREEZE_SELECT,
        year: `eq.${year}`,
      });
    },
    async appendValidatedYearMovies(input) {
      if (!input.movies.length) return;
      await request("validated_year_movies", {
        method: "POST",
        query: { on_conflict: "year,movie_id" },
        body: input.movies.map((movie) => ({
          year: input.year,
          movie_id: movie.movieId,
          payload: movie.payload,
          created_at: input.createdAt,
        })),
        prefer: ["resolution=merge-duplicates"],
      });
    },
    async listValidatedYearProgress(year) {
      return selectRows<DatabaseValidatedYearProgressRow>("validated_year_progress", {
        select: VALIDATED_YEAR_PROGRESS_SELECT,
        year: `eq.${year}`,
      });
    },
    async markValidatedYearQuarter(year, quarter, movieCount, completedAt) {
      await request("validated_year_progress", {
        method: "POST",
        query: { on_conflict: "year,quarter" },
        body: {
          year,
          quarter,
          movie_count: movieCount,
          completed_at: completedAt,
        },
        prefer: ["resolution=merge-duplicates"],
      });
    },
    async upsertValidatedYearFreeze(year, frozenAt, movieCount) {
      await request("validated_year_freezes", {
        method: "POST",
        query: { on_conflict: "year" },
        body: { year, frozen_at: frozenAt, movie_count: movieCount },
        prefer: ["resolution=merge-duplicates"],
      });
    },
    async clearValidatedYearFreeze(year) {
      await request("validated_year_freezes", {
        method: "DELETE",
        query: { year: `eq.${year}` },
      });
      await request("validated_year_progress", {
        method: "DELETE",
        query: { year: `eq.${year}` },
      });
      await request("validated_year_movies", {
        method: "DELETE",
        query: { year: `eq.${year}` },
      });
    },
    async getUserRating(userId, movieId) {
      return selectSingleRow<DatabaseUserRatingRow>("movie_user_ratings", {
        select: USER_RATING_SELECT,
        user_id: `eq.${userId}`,
        movie_id: `eq.${movieId}`,
      });
    },
    async listUserRatingsForMovie(movieId) {
      return selectRows<DatabaseUserRatingRow>("movie_user_ratings", {
        select: USER_RATING_SELECT,
        movie_id: `eq.${movieId}`,
      });
    },
    async upsertUserRating(input) {
      await request("movie_user_ratings", {
        method: "POST",
        query: { on_conflict: "user_id,movie_id" },
        body: {
          user_id: input.userId,
          movie_id: input.movieId,
          rating: input.rating,
          watch_status: input.watchStatus,
          updated_at: input.updatedAt,
        },
        prefer: ["resolution=merge-duplicates"],
      });
    },
    async listUserReviewsForMovie(movieId, includeHidden) {
      return selectRows<DatabaseUserReviewRow>("movie_user_reviews", {
        select: USER_REVIEW_SELECT,
        movie_id: `eq.${movieId}`,
        ...(includeHidden ? {} : { status: "eq.published" }),
        order: "created_at.desc",
      });
    },
    async listAllUserReviews(limit) {
      return selectRows<DatabaseUserReviewRow>("movie_user_reviews", {
        select: USER_REVIEW_SELECT,
        order: "created_at.desc",
        limit,
      });
    },
    async getUserReview(userId, movieId) {
      return selectSingleRow<DatabaseUserReviewRow>("movie_user_reviews", {
        select: USER_REVIEW_SELECT,
        user_id: `eq.${userId}`,
        movie_id: `eq.${movieId}`,
      });
    },
    async upsertUserReview(input) {
      const rows = await request<DatabaseUserReviewRow[]>("movie_user_reviews", {
        method: "POST",
        query: { on_conflict: "user_id,movie_id", select: USER_REVIEW_SELECT },
        body: {
          user_id: input.userId,
          movie_id: input.movieId,
          movie_title: input.movieTitle,
          author_name: input.authorName,
          title: input.title,
          body: input.body,
          rating: input.rating,
          status: input.status,
          created_at: input.createdAt,
          updated_at: input.updatedAt,
        },
        prefer: ["resolution=merge-duplicates", "return=representation"],
      });
      return rows?.[0] ?? null;
    },
    async setUserReviewStatus(id, status, updatedAt) {
      await request("movie_user_reviews", {
        method: "PATCH",
        query: { id: `eq.${id}` },
        body: { status, updated_at: updatedAt },
      });
    },
    async deleteUserReview(id) {
      await request("movie_user_reviews", { method: "DELETE", query: { id: `eq.${id}` } });
    },
    async listPolls(activeOnly) {
      return selectRows<DatabasePollRow>("polls", {
        select: POLL_SELECT,
        ...(activeOnly ? { is_active: "eq.1" } : {}),
        order: "created_at.desc",
      });
    },
    async getPoll(id) {
      return selectSingleRow<DatabasePollRow>("polls", { select: POLL_SELECT, id: `eq.${id}` });
    },
    async insertPoll(input) {
      const rows = await request<DatabasePollRow[]>("polls", {
        method: "POST",
        query: { select: POLL_SELECT },
        body: {
          question: input.question,
          options: JSON.stringify(input.options),
          movie_id: input.movieId,
          movie_title: input.movieTitle,
          is_active: input.isActive ? 1 : 0,
          created_by_user_id: input.createdByUserId,
          created_at: input.createdAt,
        },
        prefer: ["return=representation"],
      });
      return rows?.[0] ?? null;
    },
    async setPollActive(id, isActive) {
      await request("polls", {
        method: "PATCH",
        query: { id: `eq.${id}` },
        body: { is_active: isActive ? 1 : 0 },
      });
    },
    async deletePoll(id) {
      await request("poll_votes", { method: "DELETE", query: { poll_id: `eq.${id}` } });
      await request("polls", { method: "DELETE", query: { id: `eq.${id}` } });
    },
    async listPollVotes(pollId) {
      return selectRows<DatabasePollVoteRow>("poll_votes", {
        select: POLL_VOTE_SELECT,
        poll_id: `eq.${pollId}`,
      });
    },
    async upsertPollVote(pollId, voterKey, optionIndex, createdAt) {
      await request("poll_votes", {
        method: "POST",
        query: { on_conflict: "poll_id,voter_key" },
        body: { poll_id: pollId, voter_key: voterKey, option_index: optionIndex, created_at: createdAt },
        prefer: ["resolution=merge-duplicates"],
      });
    },
    async listQuizQuestions(activeOnly) {
      return selectRows<DatabaseQuizQuestionRow>("quiz_questions", {
        select: QUIZ_SELECT,
        ...(activeOnly ? { is_active: "eq.1" } : {}),
        order: "created_at.desc",
      });
    },
    async getQuizQuestion(id) {
      return selectSingleRow<DatabaseQuizQuestionRow>("quiz_questions", {
        select: QUIZ_SELECT,
        id: `eq.${id}`,
      });
    },
    async insertQuizQuestion(input) {
      const rows = await request<DatabaseQuizQuestionRow[]>("quiz_questions", {
        method: "POST",
        query: { select: QUIZ_SELECT },
        body: {
          question: input.question,
          options: JSON.stringify(input.options),
          correct_index: input.correctIndex,
          category: input.category,
          is_active: input.isActive ? 1 : 0,
          created_by_user_id: input.createdByUserId,
          created_at: input.createdAt,
        },
        prefer: ["return=representation"],
      });
      return rows?.[0] ?? null;
    },
    async setQuizQuestionActive(id, isActive) {
      await request("quiz_questions", {
        method: "PATCH",
        query: { id: `eq.${id}` },
        body: { is_active: isActive ? 1 : 0 },
      });
    },
    async deleteQuizQuestion(id) {
      await request("quiz_answers", { method: "DELETE", query: { question_id: `eq.${id}` } });
      await request("quiz_questions", { method: "DELETE", query: { id: `eq.${id}` } });
    },
    async listQuizAnswers(questionId) {
      return selectRows<DatabaseQuizAnswerRow>("quiz_answers", {
        select: QUIZ_ANSWER_SELECT,
        question_id: `eq.${questionId}`,
      });
    },
    async insertQuizAnswer(questionId, voterKey, optionIndex, isCorrect, createdAt) {
      await request("quiz_answers", {
        method: "POST",
        query: { on_conflict: "question_id,voter_key" },
        body: {
          question_id: questionId,
          voter_key: voterKey,
          option_index: optionIndex,
          is_correct: isCorrect ? 1 : 0,
          created_at: createdAt,
        },
        prefer: ["resolution=ignore-duplicates"],
      });
    },
    async listBoxOffice() {
      return selectRows<DatabaseBoxOfficeRow>("movie_box_office", {
        select: BOX_OFFICE_SELECT,
        order: "updated_at.desc",
      });
    },
    async getBoxOffice(movieId) {
      return selectSingleRow<DatabaseBoxOfficeRow>("movie_box_office", {
        select: BOX_OFFICE_SELECT,
        movie_id: `eq.${movieId}`,
      });
    },
    async upsertBoxOffice(input) {
      await request("movie_box_office", {
        method: "POST",
        query: { on_conflict: "movie_id" },
        body: {
          movie_id: input.movieId,
          movie_title: input.movieTitle,
          poster_path: input.posterPath,
          release_date: input.releaseDate,
          worldwide_gross: input.worldwideGross,
          note: input.note,
          as_of: input.asOf,
          added_by_user_id: input.addedByUserId,
          updated_at: input.updatedAt,
        },
        prefer: ["resolution=merge-duplicates"],
      });
    },
    async deleteBoxOffice(movieId) {
      await request("movie_box_office", { method: "DELETE", query: { movie_id: `eq.${movieId}` } });
    },
  };
}

function createStorageProvider() {
  if (!env.DATABASE_URL) {
    return null;
  }

  if (env.DATABASE_URL.startsWith("file:")) {
    return createSqliteStorageProvider(env.DATABASE_URL);
  }

  if (hasSupabaseProjectUrl(env.DATABASE_URL)) {
    return createSupabaseStorageProvider(env.DATABASE_URL);
  }

  throw new Error(
    `Unsupported DATABASE_URL "${env.DATABASE_URL}". Use a file: URL for SQLite or your Supabase project URL, for example https://your-project-ref.supabase.co.`
  );
}

function getStorageProvider() {
  if (storageProvider === undefined) {
    storageProvider = createStorageProvider();
  }

  return storageProvider;
}

function requireStorageProvider() {
  const provider = getStorageProvider();

  if (!provider) {
    throw new Error(
      "Database storage is not configured. Set DATABASE_URL to a SQLite file: URL or Supabase project URL. Supabase deployments can also use NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL, and they must also set SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return provider;
}

export function hasDatabaseConfiguration() {
  return Boolean(env.DATABASE_URL);
}

export async function getUserRecordByEmail(email: string) {
  return requireStorageProvider().getUserByEmail(email);
}

export async function getUserRecordByIdentifier(identifier: string) {
  return requireStorageProvider().getUserByIdentifier(identifier);
}

export async function getUserRecordById(userId: number) {
  return requireStorageProvider().getUserById(userId);
}

export async function listUserRecords() {
  return requireStorageProvider().listUsers();
}

export async function countUserRecords() {
  return requireStorageProvider().countUsers();
}

export async function countUserRecordsByRole(role: StoredUserRole) {
  return requireStorageProvider().countUsersByRole(role);
}

export async function createUserRecord(input: CreateUserRecordInput) {
  return requireStorageProvider().createUser(input);
}

export async function updateUserRecord(userId: number, input: UpdateUserRecordInput) {
  return requireStorageProvider().updateUser(userId, input);
}

export async function deleteUserRecord(userId: number) {
  return requireStorageProvider().deleteUser(userId);
}

export async function deleteSessionRecordsForUser(userId: number) {
  return requireStorageProvider().deleteSessionsForUser(userId);
}

export async function createSessionRecord(input: CreateSessionRecordInput) {
  return requireStorageProvider().createSession(input);
}

export async function deleteSessionRecordByTokenHash(tokenHash: string) {
  return requireStorageProvider().deleteSessionByTokenHash(tokenHash);
}

export async function getSessionUserRecordByTokenHash(tokenHash: string) {
  return requireStorageProvider().getSessionUserByTokenHash(tokenHash);
}

export async function prunePasswordResetTokenRecords(nowIso: string) {
  return requireStorageProvider().deleteUsedOrExpiredPasswordResetTokens(nowIso);
}

export async function createPasswordResetTokenRecord(
  input: CreatePasswordResetTokenRecordInput
) {
  return requireStorageProvider().createPasswordResetToken(input);
}

export async function getPasswordResetTokenRecordByHash(tokenHash: string) {
  return requireStorageProvider().getPasswordResetTokenByHash(tokenHash);
}

export async function markPasswordResetTokenRecordUsed(id: number, usedAt: string) {
  return requireStorageProvider().markPasswordResetTokenUsed(id, usedAt);
}

export async function getMovieBackdropOverrideRecord(movieId: number) {
  return requireStorageProvider().getBackdropOverride(movieId);
}

export async function upsertMovieBackdropOverrideRecord(
  input: UpsertBackdropOverrideRecordInput
) {
  return requireStorageProvider().upsertBackdropOverride(input);
}

export async function deleteMovieBackdropOverrideRecord(movieId: number) {
  return requireStorageProvider().deleteBackdropOverride(movieId);
}

export async function getCustomImageRecord(movieId: number, imageType: "poster" | "backdrop") {
  return requireStorageProvider().getCustomImage(movieId, imageType);
}

export async function getCustomImageRecordsByMovieId(movieId: number) {
  return requireStorageProvider().getCustomImagesByMovieId(movieId);
}

export async function upsertCustomImageRecord(input: {
  movieId: number;
  imageType: "poster" | "backdrop";
  fileName: string;
  mimeType: string;
  uploadedByUserId: number | null;
  createdAt: string;
}) {
  return requireStorageProvider().upsertCustomImage(input);
}

export async function deleteCustomImageRecord(movieId: number, imageType: "poster" | "backdrop") {
  return requireStorageProvider().deleteCustomImage(movieId, imageType);
}

export async function listManualMovieRecords() {
  return requireStorageProvider().listManualMovies();
}

export async function getManualMovieRecord(movieId: number) {
  return requireStorageProvider().getManualMovie(movieId);
}

export async function insertManualMovieRecord(input: {
  movieId: number;
  tmdbTitle: string;
  releaseDate: string | null;
  addedByUserId: number | null;
  createdAt: string;
}) {
  return requireStorageProvider().insertManualMovie(input);
}

export async function deleteManualMovieRecord(movieId: number) {
  return requireStorageProvider().deleteManualMovie(movieId);
}

export async function listMovieVideoRecords(movieId: number) {
  return requireStorageProvider().listMovieVideos(movieId);
}

export async function insertMovieVideoRecord(input: {
  movieId: number;
  youtubeKey: string;
  title: string;
  category: string;
  addedByUserId: number | null;
  createdAt: string;
}) {
  return requireStorageProvider().insertMovieVideo(input);
}

export async function deleteMovieVideoRecord(id: number) {
  return requireStorageProvider().deleteMovieVideo(id);
}

export async function listHiddenVideoKeys(movieId: number): Promise<string[]> {
  const rows = await requireStorageProvider().listHiddenVideos(movieId);
  return rows.map((row) => row.youtube_key);
}

export async function addHiddenVideoKey(input: {
  movieId: number;
  youtubeKey: string;
  createdAt: string;
}) {
  return requireStorageProvider().insertHiddenVideo(input);
}

export async function removeHiddenVideoKey(movieId: number, youtubeKey: string) {
  return requireStorageProvider().deleteHiddenVideo(movieId, youtubeKey);
}

export async function listHiddenMovieIds(): Promise<number[]> {
  const rows = await requireStorageProvider().listHiddenMovies();
  return rows.map((row) => row.movie_id);
}

export async function addHiddenMovie(input: {
  movieId: number;
  addedByUserId: number | null;
  createdAt: string;
}) {
  return requireStorageProvider().insertHiddenMovie(input);
}

export async function removeHiddenMovie(movieId: number) {
  return requireStorageProvider().deleteHiddenMovie(movieId);
}

export async function listMovieReleaseOverrideRecords() {
  return requireStorageProvider().listMovieReleaseOverrides();
}

export async function getMovieReleaseOverrideRecord(movieId: number) {
  return requireStorageProvider().getMovieReleaseOverride(movieId);
}

export async function upsertMovieReleaseOverrideRecord(input: {
  movieId: number;
  releaseDate: string | null;
  aliases: string[];
  addedByUserId: number | null;
  updatedAt: string;
}) {
  return requireStorageProvider().upsertMovieReleaseOverride(input);
}

export async function deleteMovieReleaseOverrideRecord(movieId: number) {
  return requireStorageProvider().deleteMovieReleaseOverride(movieId);
}

export async function getMovieDetailOverrideRecord(movieId: number) {
  return requireStorageProvider().getMovieDetailOverride(movieId);
}

export async function upsertMovieDetailOverrideRecord(input: {
  movieId: number;
  facts: string | null;
  companies: string | null;
  addedByUserId: number | null;
  updatedAt: string;
}) {
  return requireStorageProvider().upsertMovieDetailOverride(input);
}

export async function deleteMovieDetailOverrideRecord(movieId: number) {
  return requireStorageProvider().deleteMovieDetailOverride(movieId);
}

export async function getSongSyncRecord(movieId: number) {
  return requireStorageProvider().getSongSync(movieId);
}

export async function upsertSongSyncRecord(movieId: number, syncedAt: string) {
  return requireStorageProvider().upsertSongSync(movieId, syncedAt);
}

export async function listTrendingSignalRecords() {
  return requireStorageProvider().listTrendingSignals();
}

export async function upsertTrendingMentionCount(
  movieId: number,
  mentionCount: number,
  updatedAt: string
) {
  return requireStorageProvider().upsertMentionCount(movieId, mentionCount, updatedAt);
}

export async function setAdminTrendingOrderRecords(
  orderedMovieIds: number[],
  updatedAt: string
) {
  return requireStorageProvider().setAdminTrendingOrder(orderedMovieIds, updatedAt);
}

export async function clearAdminTrendingOrderRecords(updatedAt: string) {
  return requireStorageProvider().clearAdminTrendingOrder(updatedAt);
}

export async function listValidatedYearMovieRecords(year: number) {
  return requireStorageProvider().listValidatedYearMovies(year);
}

export async function isValidatedYearFrozen(year: number) {
  const freeze = await requireStorageProvider().getValidatedYearFreeze(year);
  return Boolean(freeze);
}

export async function appendValidatedYearMovies(
  year: number,
  movies: { movieId: number; payload: string }[],
  createdAt: string
) {
  return requireStorageProvider().appendValidatedYearMovies({ year, movies, createdAt });
}

export async function listValidatedYearProgressRecords(year: number) {
  return requireStorageProvider().listValidatedYearProgress(year);
}

export async function markValidatedYearQuarter(
  year: number,
  quarter: number,
  movieCount: number,
  completedAt: string
) {
  return requireStorageProvider().markValidatedYearQuarter(
    year,
    quarter,
    movieCount,
    completedAt
  );
}

export async function upsertValidatedYearFreeze(
  year: number,
  frozenAt: string,
  movieCount: number
) {
  return requireStorageProvider().upsertValidatedYearFreeze(year, frozenAt, movieCount);
}

export async function clearValidatedYearFreeze(year: number) {
  return requireStorageProvider().clearValidatedYearFreeze(year);
}

// --- Community -------------------------------------------------------------

export async function getUserRatingRecord(userId: number, movieId: number) {
  return requireStorageProvider().getUserRating(userId, movieId);
}

export async function listUserRatingRecordsForMovie(movieId: number) {
  return requireStorageProvider().listUserRatingsForMovie(movieId);
}

export async function upsertUserRatingRecord(input: UpsertUserRatingInput) {
  return requireStorageProvider().upsertUserRating(input);
}

export async function listUserReviewRecordsForMovie(movieId: number, includeHidden = false) {
  return requireStorageProvider().listUserReviewsForMovie(movieId, includeHidden);
}

export async function listAllUserReviewRecords(limit = 100) {
  return requireStorageProvider().listAllUserReviews(limit);
}

export async function getUserReviewRecord(userId: number, movieId: number) {
  return requireStorageProvider().getUserReview(userId, movieId);
}

export async function upsertUserReviewRecord(input: UpsertUserReviewInput) {
  return requireStorageProvider().upsertUserReview(input);
}

export async function setUserReviewStatusRecord(id: number, status: UserReviewStatus, updatedAt: string) {
  return requireStorageProvider().setUserReviewStatus(id, status, updatedAt);
}

export async function deleteUserReviewRecord(id: number) {
  return requireStorageProvider().deleteUserReview(id);
}

export async function listPollRecords(activeOnly = false) {
  return requireStorageProvider().listPolls(activeOnly);
}

export async function getPollRecord(id: number) {
  return requireStorageProvider().getPoll(id);
}

export async function insertPollRecord(input: InsertPollInput) {
  return requireStorageProvider().insertPoll(input);
}

export async function setPollActiveRecord(id: number, isActive: boolean) {
  return requireStorageProvider().setPollActive(id, isActive);
}

export async function deletePollRecord(id: number) {
  return requireStorageProvider().deletePoll(id);
}

export async function listPollVoteRecords(pollId: number) {
  return requireStorageProvider().listPollVotes(pollId);
}

export async function upsertPollVoteRecord(
  pollId: number,
  voterKey: string,
  optionIndex: number,
  createdAt: string
) {
  return requireStorageProvider().upsertPollVote(pollId, voterKey, optionIndex, createdAt);
}

export async function listQuizQuestionRecords(activeOnly = false) {
  return requireStorageProvider().listQuizQuestions(activeOnly);
}

export async function getQuizQuestionRecord(id: number) {
  return requireStorageProvider().getQuizQuestion(id);
}

export async function insertQuizQuestionRecord(input: InsertQuizQuestionInput) {
  return requireStorageProvider().insertQuizQuestion(input);
}

export async function setQuizQuestionActiveRecord(id: number, isActive: boolean) {
  return requireStorageProvider().setQuizQuestionActive(id, isActive);
}

export async function deleteQuizQuestionRecord(id: number) {
  return requireStorageProvider().deleteQuizQuestion(id);
}

export async function listQuizAnswerRecords(questionId: number) {
  return requireStorageProvider().listQuizAnswers(questionId);
}

export async function insertQuizAnswerRecord(
  questionId: number,
  voterKey: string,
  optionIndex: number,
  isCorrect: boolean,
  createdAt: string
) {
  return requireStorageProvider().insertQuizAnswer(questionId, voterKey, optionIndex, isCorrect, createdAt);
}

export async function listBoxOfficeRecords() {
  return requireStorageProvider().listBoxOffice();
}

export async function getBoxOfficeRecord(movieId: number) {
  return requireStorageProvider().getBoxOffice(movieId);
}

export async function upsertBoxOfficeRecord(input: UpsertBoxOfficeInput) {
  return requireStorageProvider().upsertBoxOffice(input);
}

export async function deleteBoxOfficeRecord(movieId: number) {
  return requireStorageProvider().deleteBoxOffice(movieId);
}

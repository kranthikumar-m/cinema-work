import "server-only";
import {
  getUserRatingRecord,
  getUserReviewRecord,
  hasDatabaseConfiguration,
  listBoxOfficeRecords,
  listPollRecords,
  listPollVoteRecords,
  listQuizAnswerRecords,
  listQuizQuestionRecords,
  listUserRatingRecordsForMovie,
  listUserReviewRecordsForMovie,
  type DatabaseUserReviewRow,
  type WatchStatus,
} from "@/lib/database";
import type { AuthUser } from "@/types/auth";

/**
 * Read models for the community features (user ratings and reviews, polls,
 * quiz, admin-entered box office). Every function degrades to an empty result
 * when the database is unavailable so pages still render.
 */

export interface MovieCommunitySummary {
  /** Average user rating out of 5, one decimal, or null when nobody rated. */
  average: number | null;
  count: number;
  watched: number;
  want: number;
}

export interface UserReviewView {
  id: number;
  movieId: number;
  movieTitle: string;
  authorName: string;
  title: string;
  body: string;
  rating: number | null;
  status: "published" | "hidden";
  createdAt: string;
  mine: boolean;
}

export interface MovieCommunity {
  summary: MovieCommunitySummary;
  mine: { rating: number | null; watchStatus: WatchStatus | null } | null;
  myReview: UserReviewView | null;
  reviews: UserReviewView[];
}

export const EMPTY_COMMUNITY: MovieCommunity = {
  summary: { average: null, count: 0, watched: 0, want: 0 },
  mine: null,
  myReview: null,
  reviews: [],
};

export function toReviewView(row: DatabaseUserReviewRow, userId: number | null): UserReviewView {
  return {
    id: row.id,
    movieId: row.movie_id,
    movieTitle: row.movie_title,
    authorName: row.author_name,
    title: row.title,
    body: row.body,
    rating: row.rating,
    status: row.status,
    createdAt: row.created_at,
    mine: userId !== null && row.user_id === userId,
  };
}

export async function getMovieCommunitySummary(movieId: number): Promise<MovieCommunitySummary> {
  if (!hasDatabaseConfiguration()) return EMPTY_COMMUNITY.summary;
  try {
    const rows = await listUserRatingRecordsForMovie(movieId);
    const rated = rows.filter((row) => row.rating != null) as { rating: number }[];
    const average = rated.length
      ? Math.round((rated.reduce((sum, row) => sum + row.rating, 0) / rated.length) * 10) / 10
      : null;
    return {
      average,
      count: rated.length,
      watched: rows.filter((row) => row.watch_status === "watched").length,
      want: rows.filter((row) => row.watch_status === "want").length,
    };
  } catch {
    return EMPTY_COMMUNITY.summary;
  }
}

export async function getMovieCommunity(
  movieId: number,
  user: AuthUser | null
): Promise<MovieCommunity> {
  if (!hasDatabaseConfiguration()) return EMPTY_COMMUNITY;
  try {
    const [summary, reviews, mineRow, myReviewRow] = await Promise.all([
      getMovieCommunitySummary(movieId),
      listUserReviewRecordsForMovie(movieId, false),
      user ? getUserRatingRecord(user.id, movieId) : Promise.resolve(null),
      user ? getUserReviewRecord(user.id, movieId) : Promise.resolve(null),
    ]);
    const userId = user?.id ?? null;
    return {
      summary,
      mine: user
        ? { rating: mineRow?.rating ?? null, watchStatus: mineRow?.watch_status ?? null }
        : null,
      myReview: myReviewRow ? toReviewView(myReviewRow, userId) : null,
      reviews: reviews.map((row) => toReviewView(row, userId)),
    };
  } catch {
    return EMPTY_COMMUNITY;
  }
}

// --- Polls -------------------------------------------------------------------

export interface PollView {
  id: number;
  question: string;
  movieId: number | null;
  movieTitle: string | null;
  createdAt: string;
  isActive: boolean;
  totalVotes: number;
  options: { label: string; votes: number; percent: number }[];
  myVote: number | null;
}

function parseOptions(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((option) => String(option)) : [];
  } catch {
    return [];
  }
}

export async function getPollViews(
  voterKey: string | null,
  { activeOnly = true, limit = 5 }: { activeOnly?: boolean; limit?: number } = {}
): Promise<PollView[]> {
  if (!hasDatabaseConfiguration()) return [];
  try {
    const polls = (await listPollRecords(activeOnly)).slice(0, limit);
    return Promise.all(
      polls.map(async (poll) => {
        const votes = await listPollVoteRecords(poll.id);
        const labels = parseOptions(poll.options);
        const counts = labels.map(
          (_, index) => votes.filter((vote) => vote.option_index === index).length
        );
        const total = counts.reduce((sum, count) => sum + count, 0);
        return {
          id: poll.id,
          question: poll.question,
          movieId: poll.movie_id,
          movieTitle: poll.movie_title,
          createdAt: poll.created_at,
          isActive: poll.is_active === 1,
          totalVotes: total,
          options: labels.map((label, index) => ({
            label,
            votes: counts[index],
            percent: total ? Math.round((counts[index] / total) * 100) : 0,
          })),
          myVote: voterKey
            ? votes.find((vote) => vote.voter_key === voterKey)?.option_index ?? null
            : null,
        };
      })
    );
  } catch {
    return [];
  }
}

// --- Quiz --------------------------------------------------------------------

export interface QuizView {
  id: number;
  question: string;
  category: string;
  options: string[];
  createdAt: string;
  isActive: boolean;
  participants: number;
  correctPercent: number;
  myAnswer: number | null;
  /** Revealed only once the viewer has answered. */
  correctIndex: number | null;
}

export async function getQuizViews(
  voterKey: string | null,
  { activeOnly = true, limit = 3, reveal = false }: { activeOnly?: boolean; limit?: number; reveal?: boolean } = {}
): Promise<QuizView[]> {
  if (!hasDatabaseConfiguration()) return [];
  try {
    const questions = (await listQuizQuestionRecords(activeOnly)).slice(0, limit);
    return Promise.all(
      questions.map(async (question) => {
        const answers = await listQuizAnswerRecords(question.id);
        const mine = voterKey ? answers.find((answer) => answer.voter_key === voterKey) : undefined;
        const correct = answers.filter((answer) => answer.is_correct === 1).length;
        return {
          id: question.id,
          question: question.question,
          category: question.category,
          options: parseOptions(question.options),
          createdAt: question.created_at,
          isActive: question.is_active === 1,
          participants: answers.length,
          correctPercent: answers.length ? Math.round((correct / answers.length) * 100) : 0,
          myAnswer: mine?.option_index ?? null,
          correctIndex: mine || reveal ? question.correct_index : null,
        };
      })
    );
  } catch {
    return [];
  }
}

// --- Box office --------------------------------------------------------------

export interface BoxOfficeView {
  movieId: number;
  movieTitle: string;
  posterPath: string | null;
  releaseDate: string | null;
  worldwideGross: string;
  note: string | null;
  asOf: string | null;
  updatedAt: string;
}

export async function getBoxOfficeViews(limit = 6): Promise<BoxOfficeView[]> {
  if (!hasDatabaseConfiguration()) return [];
  try {
    return (await listBoxOfficeRecords()).slice(0, limit).map((row) => ({
      movieId: row.movie_id,
      movieTitle: row.movie_title,
      posterPath: row.poster_path,
      releaseDate: row.release_date,
      worldwideGross: row.worldwide_gross,
      note: row.note,
      asOf: row.as_of,
      updatedAt: row.updated_at,
    }));
  } catch {
    return [];
  }
}

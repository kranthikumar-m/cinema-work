"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, Heart, Loader2, Star, Trash2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { RatingRing } from "@/components/shared/RatingRing";
import { useOptionalAuthUser } from "@/components/auth/AuthUserProvider";
import type { MovieCommunity, MovieCommunitySummary, UserReviewView } from "@/services/community";

type WatchStatus = "watched" | "want" | "no";

interface MovieCommunityPanelProps {
  movieId: number;
  movieTitle: string;
  initial: MovieCommunity;
}

const WATCH_OPTIONS: { key: WatchStatus; label: string; icon: typeof Eye }[] = [
  { key: "watched", label: "Yes, watched it", icon: Eye },
  { key: "want", label: "Want to watch", icon: Heart },
  { key: "no", label: "No", icon: EyeOff },
];

function Stars({
  value,
  hover,
  onHover,
  onSelect,
  disabled,
}: {
  value: number | null;
  hover: number | null;
  onHover: (v: number | null) => void;
  onSelect: (v: number) => void;
  disabled: boolean;
}) {
  const shown = hover ?? value ?? 0;
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          disabled={disabled}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(star)}
          onBlur={() => onHover(null)}
          onClick={() => onSelect(star)}
          className="rounded-full p-0.5 transition disabled:cursor-not-allowed"
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              star <= shown ? "fill-[var(--color-accent)] text-[var(--color-accent)]" : "text-[var(--color-muted)]"
            )}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Community block in the Reviews section: the user average, "Have you
 * watched this?", a 5-star rating and a review form, plus published reviews.
 */
export function MovieCommunityPanel({ movieId, movieTitle, initial }: MovieCommunityPanelProps) {
  const auth = useOptionalAuthUser();
  const user = auth?.user ?? null;

  const [summary, setSummary] = useState<MovieCommunitySummary>(initial.summary);
  const [mine, setMine] = useState(initial.mine);
  const [reviews, setReviews] = useState<UserReviewView[]>(initial.reviews);
  const [myReview, setMyReview] = useState<UserReviewView | null>(initial.myReview);
  const [hover, setHover] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState(initial.myReview?.title ?? "");
  const [body, setBody] = useState(initial.myReview?.body ?? "");
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  async function saveRating(patch: { rating?: number | null; watchStatus?: WatchStatus | null }) {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/movies/${movieId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as {
        error?: string;
        summary?: MovieCommunitySummary;
        mine?: { rating: number | null; watchStatus: WatchStatus | null };
      };
      if (!res.ok) throw new Error(data.error || "Could not save your rating.");
      if (data.summary) setSummary(data.summary);
      if (data.mine) setMine(data.mine);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your rating.");
    } finally {
      setSaving(false);
    }
  }

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/movies/${movieId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, rating: mine?.rating ?? null, movieTitle }),
      });
      const data = (await res.json()) as { error?: string; review?: UserReviewView | null };
      if (!res.ok) throw new Error(data.error || "Could not post your review.");
      if (data.review) {
        setMyReview(data.review);
        setReviews((list) => [data.review as UserReviewView, ...list.filter((r) => !r.mine)]);
      }
      setFormOpen(false);
      setPosted(true);
      setTimeout(() => setPosted(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post your review.");
    } finally {
      setPosting(false);
    }
  }

  async function deleteReview() {
    if (!user || !myReview) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/movies/${movieId}/reviews`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete your review.");
      setMyReview(null);
      setReviews((list) => list.filter((r) => !r.mine));
      setTitle("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete your review.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Audience score */}
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.5)] p-5">
        <RatingRing rating={summary.average} max={5} size={84} />
        <div>
          <p className="eyebrow-label text-[var(--color-accent)]">Audience verdict</p>
          <p className="mt-1 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--color-text)]">
            {summary.average ? `${summary.average.toFixed(1)} / 5` : "No ratings yet"}
          </p>
          <p className="text-xs text-[var(--color-muted-strong)]">
            {summary.count} {summary.count === 1 ? "rating" : "ratings"}
            {summary.watched ? ` · ${summary.watched} watched` : ""}
            {summary.want ? ` · ${summary.want} want to watch` : ""}
          </p>
        </div>
      </div>

      {/* Your take */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.5)] p-5">
        {user ? (
          <>
            <p className="eyebrow-label text-[var(--color-muted)]">Have you watched this movie?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {WATCH_OPTIONS.map((option) => {
                const active = mine?.watchStatus === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={saving}
                    onClick={() => saveRating({ watchStatus: active ? null : option.key })}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      active
                        ? "border-transparent bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                        : "border-[var(--color-border)] text-[var(--color-muted-strong)] hover:text-[var(--color-text)]"
                    )}
                  >
                    <option.icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div>
                <p className="eyebrow-label text-[var(--color-muted)]">Rate this movie</p>
                <div className="mt-1 flex items-center gap-3">
                  <Stars
                    value={mine?.rating ?? null}
                    hover={hover}
                    onHover={setHover}
                    onSelect={(value) => saveRating({ rating: mine?.rating === value ? null : value })}
                    disabled={saving}
                  />
                  <span className="text-sm tabular-nums text-[var(--color-muted-strong)]">
                    {hover ?? mine?.rating ?? 0} / 5
                  </span>
                  {saving && <Loader2 className="h-4 w-4 animate-spin text-[var(--color-accent)]" />}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen((open) => !open)}
                className="ml-auto rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-accent-contrast)] transition hover:brightness-105"
              >
                {myReview ? "Edit your review" : "Write your review"}
              </button>
            </div>

            {formOpen && (
              <form onSubmit={submitReview} className="mt-4 space-y-3">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  required
                  placeholder="Review title"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                />
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  minLength={20}
                  maxLength={4000}
                  required
                  rows={5}
                  placeholder="What did you think? At least 20 characters."
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={posting}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-accent-contrast)] transition hover:brightness-105 disabled:opacity-60"
                  >
                    {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Publish review
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted-strong)] transition hover:text-[var(--color-text)]"
                  >
                    Cancel
                  </button>
                  {myReview && (
                    <button
                      type="button"
                      onClick={deleteReview}
                      disabled={posting}
                      className="ml-auto inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] transition hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete my review
                    </button>
                  )}
                </div>
              </form>
            )}
            {posted && <p className="mt-3 text-xs text-[var(--color-accent)]">Review published.</p>}
            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
          </>
        ) : (
          <div className="flex h-full flex-col justify-center">
            <p className="eyebrow-label text-[var(--color-muted)]">Your take</p>
            <p className="mt-1 text-sm text-[var(--color-text)]">
              Rate this movie, mark it watched, and publish your own review.
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/login?next=/movie/${movieId}%23reviews`}
                className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-accent-contrast)] transition hover:brightness-105"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text)] transition hover:border-[rgba(194,154,98,0.5)]"
              >
                Create account
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Published reviews */}
      {reviews.length > 0 && (
        <div className="lg:col-span-2">
          <p className="eyebrow-label mb-3 text-[var(--color-muted)]">
            Audience reviews · {reviews.length}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {reviews.map((review) => (
              <article
                key={review.id}
                className={cn(
                  "rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.5)] p-4",
                  review.mine && "border-[rgba(194,154,98,0.45)]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-text)]">
                      {review.title}
                    </h4>
                    <p className="text-xs text-[var(--color-muted)]">
                      {review.authorName}
                      {review.mine ? " (you)" : ""} · {formatDate(review.createdAt)}
                    </p>
                  </div>
                  {review.rating ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--color-accent-strong)]">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {review.rating}/5
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]/85">
                  {review.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { RatingRing } from "@/components/shared/RatingRing";
import type { CriticVerdict } from "@/services/critic-reviews";

interface CriticReviewsPanelProps {
  verdict: CriticVerdict | null;
  imdbRating: number | null;
  imdbVotes: number | null;
}

/**
 * Score summary at the top of the Reviews section: the averaged critic
 * verdict (out of 5) with each source's rating, beside the IMDb score.
 */
export function CriticReviewsPanel({ verdict, imdbRating, imdbVotes }: CriticReviewsPanelProps) {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex flex-col gap-5 rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.5)] p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <RatingRing rating={verdict?.average ?? null} max={5} size={84} />
          <div>
            <p className="eyebrow-label text-[var(--color-accent)]">Critic verdict</p>
            <p className="mt-1 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--color-text)]">
              {verdict ? `${verdict.average.toFixed(1)} / 5` : "Not rated yet"}
            </p>
            <p className="text-xs text-[var(--color-muted-strong)]">
              {verdict
                ? `${verdict.count} ${verdict.count === 1 ? "critic" : "critics"} · Gulte, 123telugu`
                : "No published critic ratings found for this title."}
            </p>
          </div>
        </div>
        {verdict && (
          <ul className="flex flex-1 flex-wrap gap-2 sm:justify-end">
            {verdict.reviews.map((review) => (
              <li key={review.url}>
                <a
                  href={review.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text)] transition hover:border-[rgba(194,154,98,0.5)] hover:bg-[var(--color-accent-soft)]"
                >
                  <span className="font-semibold text-[var(--color-accent-strong)]">
                    {review.rating.toFixed(review.rating % 1 ? 2 : 1).replace(/\.?0+$/, "")}/5
                  </span>
                  <span className="text-[var(--color-muted-strong)]">{review.sourceLabel}</span>
                  {review.publishedAt && (
                    <span className="text-[var(--color-muted)]">{formatDate(review.publishedAt)}</span>
                  )}
                  <ExternalLink className="h-3 w-3 text-[var(--color-muted)] transition group-hover:text-[var(--color-accent)]" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.5)] p-5">
        <RatingRing rating={imdbRating} size={64} />
        <div>
          <p className="eyebrow-label text-[var(--color-accent)]">IMDb</p>
          <p className="mt-1 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--color-text)]">
            {imdbRating ? `${imdbRating.toFixed(1)} / 10` : "Not rated"}
          </p>
          <p className="text-xs text-[var(--color-muted-strong)]">
            {imdbVotes ? `${imdbVotes.toLocaleString()} votes` : "Audience score"}
          </p>
        </div>
      </div>
    </div>
  );
}

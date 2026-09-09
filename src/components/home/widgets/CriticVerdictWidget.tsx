import Image from "next/image";
import Link from "next/link";
import { Award } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { RatingRing } from "@/components/shared/RatingRing";
import { WidgetEmpty, WidgetShell } from "@/components/home/widgets/WidgetShell";
import type { CriticVerdictSummary } from "@/types/widgets";

interface CriticVerdictWidgetProps {
  verdicts: CriticVerdictSummary[];
}

/** Aggregated critic scores (out of 5) for the most recently reviewed films. */
export function CriticVerdictWidget({ verdicts }: CriticVerdictWidgetProps) {
  return (
    <WidgetShell title="Critic Verdict" icon={Award} href="/reviews">
      {verdicts.length ? (
        <ul className="space-y-2.5">
          {verdicts.slice(0, 5).map((verdict) => {
            const inner = (
              <>
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--color-bg-deep)]">
                  {verdict.posterPath ? (
                    <Image
                      src={getImageUrl(verdict.posterPath, "w200")}
                      alt={verdict.movieTitle}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : verdict.image ? (
                    <Image
                      src={verdict.image}
                      alt={verdict.movieTitle}
                      fill
                      sizes="40px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">
                    {verdict.movieTitle}
                  </p>
                  <p className="text-xs text-[var(--color-muted-strong)]">
                    {verdict.count} {verdict.count === 1 ? "critic" : "critics"}
                  </p>
                </div>
                <RatingRing rating={verdict.average} max={5} size={40} />
              </>
            );
            const className = "group flex items-center gap-3";
            return (
              <li key={verdict.movieTitle}>
                {verdict.movieId ? (
                  <Link href={`/movie/${verdict.movieId}#reviews`} className={className}>
                    {inner}
                  </Link>
                ) : verdict.latestUrl ? (
                  <a href={verdict.latestUrl} target="_blank" rel="noopener noreferrer" className={className}>
                    {inner}
                  </a>
                ) : (
                  <div className={className}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <WidgetEmpty>No rated reviews yet.</WidgetEmpty>
      )}
      <p className="mt-3 text-[10px] text-[var(--color-muted)]">
        Averaged from Gulte and 123telugu reviews, out of 5.
      </p>
    </WidgetShell>
  );
}

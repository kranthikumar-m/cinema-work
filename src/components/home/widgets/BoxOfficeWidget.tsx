import Image from "next/image";
import Link from "next/link";
import { IndianRupee } from "lucide-react";
import { formatDate, getImageUrl } from "@/lib/utils";
import { WidgetEmpty, WidgetShell } from "@/components/home/widgets/WidgetShell";
import type { BoxOfficeView } from "@/services/community";

interface BoxOfficeWidgetProps {
  entries: BoxOfficeView[];
}

/** Admin-entered worldwide gross per film, newest update first. */
export function BoxOfficeWidget({ entries }: BoxOfficeWidgetProps) {
  return (
    <WidgetShell title="Box Office" icon={IndianRupee} note="Worldwide gross">
      {entries.length ? (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.movieId}>
              <Link href={`/movie/${entry.movieId}#details`} className="group flex items-center gap-3">
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--color-bg-deep)]">
                  {entry.posterPath && (
                    <Image
                      src={getImageUrl(entry.posterPath, "w200")}
                      alt={entry.movieTitle}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">
                    {entry.movieTitle}
                  </p>
                  <p className="text-xs text-[var(--color-muted-strong)]">
                    {entry.releaseDate ? formatDate(entry.releaseDate) : ""}
                    {entry.asOf ? ` · as of ${formatDate(entry.asOf)}` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-[family-name:var(--font-heading)] text-sm font-bold tabular-nums text-[var(--color-accent-strong)]">
                  {entry.worldwideGross}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <WidgetEmpty>No box office figures entered yet.</WidgetEmpty>
      )}
      <p className="mt-3 text-[10px] text-[var(--color-muted)]">Figures entered by our editors from trade reports.</p>
    </WidgetShell>
  );
}

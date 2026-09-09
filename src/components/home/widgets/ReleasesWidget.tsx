"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { formatDate, getMoviePosterUrl } from "@/lib/utils";
import { RatingRing } from "@/components/shared/RatingRing";
import { WidgetEmpty, WidgetShell, WidgetTabs } from "@/components/home/widgets/WidgetShell";
import type { Movie } from "@/types/tmdb";

type Tab = "today" | "upcoming" | "latest";

interface ReleasesWidgetProps {
  today: Movie[];
  upcoming: Movie[];
  latest: Movie[];
}

export function ReleasesWidget({ today, upcoming, latest }: ReleasesWidgetProps) {
  const [tab, setTab] = useState<Tab>(today.length ? "today" : "upcoming");
  const list = tab === "today" ? today : tab === "upcoming" ? upcoming : latest;

  return (
    <WidgetShell title="Movie Releases" icon={CalendarDays} href="/movies?view=upcoming">
      <WidgetTabs<Tab>
        tabs={[
          { key: "today", label: "Today", count: today.length },
          { key: "upcoming", label: "Upcoming" },
          { key: "latest", label: "Latest" },
        ]}
        active={tab}
        onChange={setTab}
      />
      {list.length ? (
        <ul className="space-y-2">
          {list.slice(0, 6).map((movie) => (
            <li key={movie.id}>
              <Link href={`/movie/${movie.id}`} className="group flex items-center gap-3">
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--color-bg-deep)]">
                  <Image
                    src={getMoviePosterUrl(movie, "w200")}
                    alt={movie.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                    unoptimized={!movie.poster_path}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">
                    {movie.title}
                  </p>
                  <p className="text-xs text-[var(--color-muted-strong)]">
                    {movie.release_date ? formatDate(movie.release_date) : "Coming soon"}
                  </p>
                </div>
                {tab === "latest" && <RatingRing rating={movie.imdb_rating ?? null} size={34} />}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <WidgetEmpty>
          {tab === "today" ? "No Telugu releases today." : "Nothing listed yet."}
        </WidgetEmpty>
      )}
    </WidgetShell>
  );
}

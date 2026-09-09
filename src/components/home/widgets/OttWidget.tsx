"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MonitorPlay } from "lucide-react";
import { formatDate, getImageUrl } from "@/lib/utils";
import { WidgetEmpty, WidgetShell, WidgetTabs } from "@/components/home/widgets/WidgetShell";
import type { OttWidgetEntry } from "@/types/widgets";

type Tab = "today" | "streaming" | "upcoming";

interface OttWidgetProps {
  entries: OttWidgetEntry[];
  todayIso: string;
}

function Row({ entry }: { entry: OttWidgetEntry }) {
  const inner = (
    <>
      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--color-bg-deep)]">
        {entry.posterPath ? (
          <Image
            src={getImageUrl(entry.posterPath, "w200")}
            alt={entry.title}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : entry.logoPath ? (
          <Image
            src={getImageUrl(entry.logoPath, "w200")}
            alt={entry.platform}
            fill
            sizes="40px"
            className="object-contain p-1.5"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">
          {entry.title}
        </p>
        <p className="truncate text-xs text-[var(--color-muted-strong)]">
          {entry.platform}
          {entry.date ? ` · ${formatDate(entry.date)}` : ""}
          {entry.language === "dub" ? " · Telugu dub" : ""}
        </p>
      </div>
    </>
  );
  const className = "group flex items-center gap-3";
  if (entry.movieId) {
    return (
      <Link href={`/movie/${entry.movieId}`} className={className}>
        {inner}
      </Link>
    );
  }
  if (entry.url) {
    return (
      <a href={entry.url} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return <div className={className}>{inner}</div>;
}

export function OttWidget({ entries, todayIso }: OttWidgetProps) {
  const dated = entries.filter((entry) => entry.date);
  const today = dated.filter((entry) => entry.date === todayIso);
  const streaming = dated
    .filter((entry) => (entry.date as string) <= todayIso)
    .sort((a, b) => (b.date as string).localeCompare(a.date as string));
  const upcoming = dated
    .filter((entry) => (entry.date as string) > todayIso)
    .sort((a, b) => (a.date as string).localeCompare(b.date as string));

  const [tab, setTab] = useState<Tab>(today.length ? "today" : "streaming");
  const list = tab === "today" ? today : tab === "streaming" ? streaming : upcoming;

  return (
    <WidgetShell title="OTT Releases" icon={MonitorPlay} href="/movies?view=online">
      <WidgetTabs<Tab>
        tabs={[
          { key: "today", label: "Today", count: today.length },
          { key: "streaming", label: "Streaming Now" },
          { key: "upcoming", label: "Upcoming", count: upcoming.length },
        ]}
        active={tab}
        onChange={setTab}
      />
      {list.length ? (
        <ul className="space-y-2">
          {list.slice(0, 7).map((entry) => (
            <li key={`${entry.title}-${entry.platform}`}>
              <Row entry={entry} />
            </li>
          ))}
        </ul>
      ) : (
        <WidgetEmpty>
          {tab === "today" ? "No OTT premieres today." : "Nothing listed right now."}
        </WidgetEmpty>
      )}
      <p className="mt-3 text-[10px] text-[var(--color-muted)]">Source: 123telugu OTT tracker</p>
    </WidgetShell>
  );
}

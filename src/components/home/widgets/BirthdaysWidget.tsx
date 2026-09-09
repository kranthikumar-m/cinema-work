"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Cake, UserRound } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { WidgetEmpty, WidgetShell, WidgetTabs } from "@/components/home/widgets/WidgetShell";
import type { BirthdayWidgetPerson } from "@/types/widgets";

type Tab = "yesterday" | "today" | "tomorrow";

interface BirthdaysWidgetProps {
  buckets: Record<Tab, BirthdayWidgetPerson[]>;
  todayIso: string;
}

function ageLine(person: BirthdayWidgetPerson, todayIso: string) {
  const birthYear = Number(person.birthday.slice(0, 4));
  if (person.deathday) return `${birthYear} – ${person.deathday.slice(0, 4)}`;
  const age = Number(todayIso.slice(0, 4)) - birthYear;
  return `${birthYear} · ${age} years`;
}

function dateLabel(todayIso: string) {
  const date = new Date(`${todayIso}T00:00:00Z`);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function BirthdaysWidget({ buckets, todayIso }: BirthdaysWidgetProps) {
  const [tab, setTab] = useState<Tab>("today");
  const list = buckets[tab] ?? [];

  return (
    <WidgetShell title="Birthdays" icon={Cake} note={dateLabel(todayIso)} href="/people">
      <WidgetTabs<Tab>
        tabs={[
          { key: "yesterday", label: "Yesterday", count: buckets.yesterday.length },
          { key: "today", label: "Today", count: buckets.today.length },
          { key: "tomorrow", label: "Tomorrow", count: buckets.tomorrow.length },
        ]}
        active={tab}
        onChange={setTab}
      />
      {list.length ? (
        <div className="tile-grid grid-cols-3">
          {list.slice(0, 6).map((person) => (
            <Link
              key={person.id}
              href={`/person/${person.id}`}
              className="group relative block aspect-[3/4] overflow-hidden bg-[var(--color-bg-deep)]"
            >
              {person.profile_path ? (
                <Image
                  src={getImageUrl(person.profile_path, "w300")}
                  alt={person.name}
                  fill
                  sizes="110px"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--color-muted)]">
                  <UserRound className="h-8 w-8" strokeWidth={1.4} />
                </div>
              )}
              <div className="tile-overlay absolute inset-x-0 bottom-0 px-2 pb-2 pt-8 text-center">
                <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-white">
                  {person.name}
                </p>
                <p className="mt-0.5 text-[9.5px] text-white/60">{ageLine(person, todayIso)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <WidgetEmpty>No birthdays on the roster {tab}.</WidgetEmpty>
      )}
    </WidgetShell>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";
import type { CrewMember } from "@/types/tmdb";

// Key crew roles, in display priority order. The card shows the person's actual
// TMDB job title(s); these tests only decide which crew to surface and how to order.
const ROLES: { test: (job: string) => boolean }[] = [
  { test: (j) => j === "Director" },
  { test: (j) => /writer|screenplay|story|dialogue/i.test(j) },
  { test: (j) => /producer/i.test(j) },
  { test: (j) => /music|composer|songs/i.test(j) },
  { test: (j) => /director of photography|cinematograph/i.test(j) },
  { test: (j) => /\beditor\b/i.test(j) },
];

function rolePriority(job: string): number {
  const idx = ROLES.findIndex((role) => role.test(job));
  return idx === -1 ? ROLES.length : idx;
}

interface CrewListProps {
  crew: CrewMember[];
}

export function CrewList({ crew }: CrewListProps) {
  const byId = new Map<
    number,
    { member: CrewMember; jobs: string[]; priority: number }
  >();

  for (const member of crew) {
    const priority = rolePriority(member.job);
    if (priority === ROLES.length) continue; // not a key role
    const existing = byId.get(member.id);
    if (existing) {
      if (!existing.jobs.includes(member.job)) existing.jobs.push(member.job);
      existing.priority = Math.min(existing.priority, priority);
    } else {
      byId.set(member.id, { member, jobs: [member.job], priority });
    }
  }

  const people = Array.from(byId.values()).sort(
    (a, b) => a.priority - b.priority || b.member.popularity - a.member.popularity
  );

  if (!people.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {people.map(({ member, jobs }) => (
        <Link
          key={member.id}
          href={`/person/${member.id}`}
          className="group flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-deep)] p-2.5 transition hover:border-[rgba(194,154,98,0.4)]"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-800">
            <Image
              src={getImageUrl(member.profile_path, "w200")}
              alt={member.name}
              fill
              className="object-cover"
              unoptimized={!member.profile_path}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">
              {member.name}
            </p>
            <p className="truncate text-xs text-[var(--color-muted-strong)]">
              {jobs.join(", ")}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

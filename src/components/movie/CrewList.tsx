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
  const byId = new Map<number, { member: CrewMember; jobs: string[] }>();

  for (const member of crew) {
    if (rolePriority(member.job) === ROLES.length) continue; // not a key role
    const existing = byId.get(member.id);
    if (existing) {
      if (!existing.jobs.includes(member.job)) existing.jobs.push(member.job);
    } else {
      byId.set(member.id, { member, jobs: [member.job] });
    }
  }

  const people = Array.from(byId.values()).sort((a, b) => {
    const photoA = a.member.profile_path ? 0 : 1;
    const photoB = b.member.profile_path ? 0 : 1;
    if (photoA !== photoB) return photoA - photoB;
    return a.member.name.localeCompare(b.member.name, undefined, { sensitivity: "base" });
  });

  if (!people.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {people.map(({ member, jobs }) => (
        <Link
          key={member.id}
          href={`/person/${member.id}`}
          className="group flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-deep)] p-2.5 transition hover:border-[rgba(26,167,230,0.4)]"
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

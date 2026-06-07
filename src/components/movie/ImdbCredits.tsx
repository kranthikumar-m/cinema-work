"use client";

import Image from "next/image";
import type { ImdbCastCredit, ImdbCrewCredit } from "@/services/omdb";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function imdbNameUrl(id: string): string | undefined {
  return id ? `https://www.imdb.com/name/${id}/` : undefined;
}

// Cast in IMDb billing order — character names + IMDb headshots, linking to IMDb.
export function ImdbCastCarousel({ cast }: { cast: ImdbCastCredit[] }) {
  const visible = cast.slice(0, 60);
  if (!visible.length) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {visible.map((person) => (
        <a
          key={`${person.id}-${person.name}`}
          href={imdbNameUrl(person.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="group w-32 flex-shrink-0"
        >
          <div className="relative mx-auto mb-2 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-[var(--color-bg-elevated)] text-lg font-semibold text-[var(--color-muted)] ring-0 ring-[var(--color-accent)] transition group-hover:ring-2">
            {person.imageUrl ? (
              <Image src={person.imageUrl} alt={person.name} fill className="object-cover" unoptimized />
            ) : (
              <span>{initials(person.name)}</span>
            )}
          </div>
          <p className="truncate text-center text-sm font-medium text-white transition-colors group-hover:text-[var(--color-accent)]">
            {person.name}
          </p>
          {person.characters.length > 0 && (
            <p className="truncate text-center text-xs text-gray-400">
              {person.characters.join(", ")}
            </p>
          )}
        </a>
      ))}
    </div>
  );
}

const CREW_PER_CATEGORY = 12;

// Crew grouped by IMDb department, in IMDb's order, with a link to the full list.
export function ImdbCrewList({
  crew,
  fullCreditsUrl,
}: {
  crew: ImdbCrewCredit[];
  fullCreditsUrl?: string;
}) {
  const groups: { id: string; label: string; members: ImdbCrewCredit[] }[] = [];
  const indexByCategory = new Map<string, number>();
  for (const member of crew) {
    let i = indexByCategory.get(member.categoryId);
    if (i === undefined) {
      i = groups.length;
      indexByCategory.set(member.categoryId, i);
      groups.push({ id: member.categoryId, label: member.categoryLabel, members: [] });
    }
    groups[i].members.push(member);
  }
  if (!groups.length) return null;

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id}>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            {group.label}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {group.members.slice(0, CREW_PER_CATEGORY).map((member) => (
              <a
                key={`${member.id}-${member.name}`}
                href={imdbNameUrl(member.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-deep)] p-2.5 transition hover:border-[rgba(194,154,98,0.4)]"
              >
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-bg-elevated)] text-xs font-semibold text-[var(--color-muted)]">
                  {member.imageUrl ? (
                    <Image src={member.imageUrl} alt={member.name} fill className="object-cover" unoptimized />
                  ) : (
                    <span>{initials(member.name)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">
                    {member.name}
                  </p>
                  {member.jobs.length > 0 && (
                    <p className="truncate text-xs text-[var(--color-muted-strong)]">
                      {member.jobs.join(", ")}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
      {fullCreditsUrl && (
        <a
          href={fullCreditsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
        >
          See full cast &amp; crew on IMDb →
        </a>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import type { ImdbCastCredit } from "@/services/omdb";

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

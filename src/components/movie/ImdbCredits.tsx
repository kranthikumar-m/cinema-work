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
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
      {visible.map((person) => (
        <a
          key={`${person.id}-${person.name}`}
          href={imdbNameUrl(person.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-xl bg-[var(--color-bg-elevated)]"
        >
          {person.imageUrl ? (
            <Image
              src={person.imageUrl}
              alt={person.name}
              fill
              sizes="144px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl font-semibold text-[var(--color-muted)]">
              {initials(person.name)}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-2.5 pb-2.5 pt-10 text-center">
            <p className="truncate text-sm font-semibold text-white">{person.name}</p>
            {person.characters.length > 0 && (
              <p className="truncate text-xs text-white/65">{person.characters.join(", ")}</p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

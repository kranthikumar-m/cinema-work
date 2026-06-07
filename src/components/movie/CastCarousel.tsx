"use client";

import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";
import type { CastMember } from "@/types/tmdb";

interface CastCarouselProps {
  cast: CastMember[];
}

export function CastCarousel({ cast }: CastCarouselProps) {
  // Keep the main (top-billed) cast, but display it alphabetically by name.
  const visible = cast
    .slice(0, 20)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  if (!visible.length) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {visible.map((person) => (
        <Link
          key={person.id}
          href={`/person/${person.id}`}
          className="group w-32 flex-shrink-0"
        >
          <div className="relative mx-auto mb-2 h-32 w-32 overflow-hidden rounded-full bg-gray-800 ring-0 ring-[var(--color-accent)] transition group-hover:ring-2">
            <Image
              src={getImageUrl(person.profile_path, "w200")}
              alt={person.name}
              fill
              className="object-cover"
              unoptimized={!person.profile_path}
            />
          </div>
          <p className="truncate text-center text-sm font-medium text-white transition-colors group-hover:text-[var(--color-accent)]">
            {person.name}
          </p>
          <p className="truncate text-center text-xs text-gray-400">
            {person.character}
          </p>
        </Link>
      ))}
    </div>
  );
}

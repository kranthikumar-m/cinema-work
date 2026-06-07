"use client";

import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";
import { ScrollRow } from "@/components/shared/ScrollRow";
import type { CastMember } from "@/types/tmdb";

interface CastCarouselProps {
  cast: CastMember[];
}

export function CastCarousel({ cast }: CastCarouselProps) {
  // Keep the main (top-billed) cast; show those with a photo first (alphabetically),
  // and sink anyone without a profile picture to the end.
  const visible = cast.slice(0, 20).sort((a, b) => {
    const photoA = a.profile_path ? 0 : 1;
    const photoB = b.profile_path ? 0 : 1;
    if (photoA !== photoB) return photoA - photoB;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
  if (!visible.length) return null;

  return (
    <ScrollRow>
      {visible.map((person) => (
        <Link
          key={person.id}
          href={`/person/${person.id}`}
          className="group relative block aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-xl bg-[var(--color-bg-elevated)]"
        >
          <Image
            src={getImageUrl(person.profile_path, "w500")}
            alt={person.name}
            fill
            sizes="144px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={!person.profile_path}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-2.5 pb-2.5 pt-10 text-center">
            <p className="truncate text-sm font-semibold text-white">{person.name}</p>
            {person.character && (
              <p className="truncate text-xs text-white/65">{person.character}</p>
            )}
          </div>
        </Link>
      ))}
    </ScrollRow>
  );
}

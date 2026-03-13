"use client";

import Image from "next/image";
import { getImageUrl } from "@/lib/utils";
import type { CastMember } from "@/types/tmdb";

interface CastCarouselProps {
  cast: CastMember[];
}

export function CastCarousel({ cast }: CastCarouselProps) {
  const visible = cast.slice(0, 20);
  if (!visible.length) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {visible.map((person) => (
        <div
          key={person.id}
          className="flex-shrink-0 w-32 group"
        >
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-800 mb-2 mx-auto">
            <Image
              src={getImageUrl(person.profile_path, "w200")}
              alt={person.name}
              fill
              className="object-cover"
              unoptimized={!person.profile_path}
            />
          </div>
          <p className="text-sm font-medium text-white text-center truncate">
            {person.name}
          </p>
          <p className="text-xs text-gray-400 text-center truncate">
            {person.character}
          </p>
        </div>
      ))}
    </div>
  );
}

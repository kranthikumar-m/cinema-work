"use client";

import Link from "next/link";
import { ImagePlus } from "lucide-react";
import { useOptionalAuthUser } from "@/components/auth/AuthUserProvider";

// Deterministic hue per title so placeholder tiles vary instead of reading as
// one grey wall.
function hueFor(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}

interface PosterPlaceholderProps {
  movieId: number;
  title: string;
  year?: string | null;
}

/**
 * Typographic stand-in for a missing poster: the title set large on a tinted
 * ground, so the grid never shows a blank grey box. Admins get an "Add poster"
 * shortcut into the admin console.
 */
export function PosterPlaceholder({ movieId, title, year }: PosterPlaceholderProps) {
  const auth = useOptionalAuthUser();
  const isAdmin = auth?.user?.role === "admin";
  const hue = hueFor(title);
  const words = title.trim().split(/\s+/);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-4 text-center"
      style={{
        background: `radial-gradient(circle at 30% 20%, hsl(${hue} 45% 22%) 0%, hsl(${hue} 35% 9%) 60%, #050607 100%)`,
      }}
    >
      <span
        aria-hidden="true"
        className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,9vw,4.5rem)] font-bold leading-none tracking-tight"
        style={{ color: `hsl(${hue} 60% 55% / 0.35)` }}
      >
        {initials}
      </span>
      <p className="mt-3 line-clamp-3 font-[family-name:var(--font-heading)] text-sm font-semibold text-white/85">
        {title}
      </p>
      {year && <p className="mt-1 text-xs text-white/50">{year}</p>}
      {isAdmin && (
        <Link
          href={`/admin?movie=${movieId}#images`}
          onClick={(event) => event.stopPropagation()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(26,167,230,0.5)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-accent)] transition hover:bg-[var(--color-accent-soft)]"
        >
          <ImagePlus className="h-3 w-3" />
          Add poster
        </Link>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Clapperboard,
  Images,
  Info,
  LayoutGrid,
  MessageSquareQuote,
  Mic2,
  Music4,
  Newspaper,
  PlayCircle,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sections a movie page can render, in page order. Ids must match the `id`
 * attribute of each section wrapper in `app/movie/[id]/page.tsx`.
 */
export const MOVIE_SECTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: Info },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "cast-crew", label: "Cast & Crew", icon: Users },
  { id: "songs", label: "Music", icon: Music4 },
  { id: "videos", label: "Videos", icon: PlayCircle },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "interviews", label: "Interviews", icon: Mic2 },
  { id: "news", label: "Feeds", icon: Newspaper },
  { id: "details", label: "Details", icon: MessageSquareQuote },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "similar", label: "Similar", icon: Clapperboard },
];

/**
 * Hook shared by the desktop rail and the mobile sub-nav: which sections exist
 * on the current page, and which one is under the viewport's reading line.
 */
export function useMovieSections() {
  const [present, setPresent] = useState<typeof MOVIE_SECTIONS>([]);
  const [activeId, setActiveId] = useState<string>("overview");

  useEffect(() => {
    const found = MOVIE_SECTIONS.filter((section) => document.getElementById(section.id));
    setPresent(found);
    if (found.length && !found.some((section) => section.id === activeId)) {
      setActiveId(found[0].id);
    }

    const elements = found
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!elements.length) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const current = found.find((section) => visible.has(section.id));
        if (current) setActiveId(current.id);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // The section list only changes with the page, which remounts this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { present, activeId, setActiveId };
}

/**
 * Movie-page replacement for the primary icon rail: a back arrow plus one entry
 * per section that actually rendered, highlighted by scroll position.
 */
export function MovieSectionRail() {
  const router = useRouter();
  const { present, activeId, setActiveId } = useMovieSections();

  return (
    <nav className="mt-1 flex w-full flex-col" aria-label="Movie sections">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex h-[52px] w-full items-center justify-center text-[var(--color-muted-strong)] transition hover:text-[var(--color-text)]"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      {(present.length ? present : MOVIE_SECTIONS.slice(0, 1)).map((section) => {
        const isActive = activeId === section.id;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={() => setActiveId(section.id)}
            aria-current={isActive ? "location" : undefined}
            className={cn(
              "flex h-[58px] w-full flex-col items-center justify-center gap-1.5 transition-colors",
              isActive
                ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                : "text-[var(--color-muted)] hover:bg-white/[0.04] hover:text-[var(--color-text)]"
            )}
          >
            <section.icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
            <span className="eyebrow-label px-1 text-center text-[0.48rem] leading-none">
              {section.label}
            </span>
          </a>
        );
      })}
      {!present.length && (
        <span className="sr-only">
          <LayoutGrid className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}

import Link from "next/link";
import { Play, ChevronRight } from "lucide-react";
import type { HomepageHeroItem } from "@/types/homepage";

interface HomeHeroActionsProps {
  item: HomepageHeroItem;
}

function isExternalLink(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function HomeHeroActions({ item }: HomeHeroActionsProps) {
  const trailerExternal = isExternalLink(item.trailerHref);

  return (
    <div className="flex flex-wrap items-center gap-4 md:gap-6">
      <Link
        href={item.watchHref}
        className="group inline-flex h-14 items-center gap-5 rounded-full bg-white px-7 text-lg font-medium text-black shadow-[0_14px_42px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(0,0,0,0.32)] md:h-16 md:px-8"
      >
        <span>Watch Now</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition group-hover:bg-[#111]">
          <ChevronRight className="h-5 w-5" />
        </span>
      </Link>

      <Link
        href={item.trailerHref}
        className="inline-flex items-center gap-3 text-lg font-semibold text-white transition hover:text-[#19ecff]"
        target={trailerExternal ? "_blank" : undefined}
        rel={trailerExternal ? "noreferrer" : undefined}
      >
        <span className="flex h-9 w-12 items-center justify-center rounded-xl bg-[#ff1212] text-white shadow-[0_8px_22px_rgba(255,18,18,0.35)]">
          <Play className="h-5 w-5 fill-current" />
        </span>
        <span>YouTube</span>
      </Link>
    </div>
  );
}


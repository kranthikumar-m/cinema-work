import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { HomepageHeroItem } from "@/types/homepage";

interface HomeHeroActionsProps {
  item: HomepageHeroItem;
}

function isExternalLink(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function HomeHeroActions({ item }: HomeHeroActionsProps) {
  const primaryHref = item.trailerHref || item.watchHref;
  const primaryExternal = isExternalLink(primaryHref);

  return (
    <div className="flex flex-wrap items-center">
      <Link
        href={primaryHref}
        target={primaryExternal ? "_blank" : undefined}
        rel={primaryExternal ? "noreferrer" : undefined}
        className="group inline-flex h-12 w-[214px] items-center justify-between rounded-full bg-white px-6 text-base font-medium text-black shadow-[0_14px_42px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(0,0,0,0.32)] md:h-14 md:w-[228px] md:px-7 md:text-lg"
      >
        <span>Watch Trailer</span>
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black text-white transition group-hover:bg-[#111]">
          <ChevronRight className="h-3 w-3" />
        </span>
      </Link>
    </div>
  );
}

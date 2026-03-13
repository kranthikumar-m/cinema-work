import Link from "next/link";
import type { HomepageHeroItem } from "@/types/homepage";

interface HomeHeroMetaProps {
  item: HomepageHeroItem;
}

function linkedValue(value: string, href?: string, extraText?: string) {
  if (!href) {
    return (
      <>
        <span className="text-[#19ecff]">{value}</span>
        {extraText ? <span className="text-white/72">{extraText}</span> : null}
      </>
    );
  }

  return (
    <>
      <Link href={href} className="text-[#19ecff] transition hover:text-white">
        {value}
      </Link>
      {extraText ? <span className="text-white/72">{extraText}</span> : null}
    </>
  );
}

export function HomeHeroMeta({ item }: HomeHeroMetaProps) {
  return (
    <div className="space-y-3 text-sm text-white/92 md:text-base">
      <p className="leading-relaxed">
        <span className="font-semibold text-white">Director:</span>{" "}
        {linkedValue(item.director, item.accentLinks.director)}
      </p>
      <p className="leading-relaxed">
        <span className="font-semibold text-white">Actors:</span>{" "}
        {linkedValue(
          item.actors.join(", "),
          item.accentLinks.cast,
          " | Cast & Crew"
        )}
      </p>
      <p className="leading-relaxed">
        <span className="font-semibold text-white">Release:</span>{" "}
        {linkedValue(item.releaseLabel, item.accentLinks.release)}
      </p>
    </div>
  );
}

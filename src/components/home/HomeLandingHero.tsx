import Image from "next/image";
import Link from "next/link";
import { Image as ImageIcon, type LucideIcon, Music4, Play, Star } from "lucide-react";
import { getBackdropUrl } from "@/lib/utils";
import type { HomepageHeroItem } from "@/types/homepage";

interface HomeLandingHeroProps {
  item: HomepageHeroItem;
  overview: string;
  genreLabel: string;
  rating: number;
}

function isExternalLink(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

function shouldUseUnoptimizedImage(src: string) {
  return /^https?:\/\//i.test(src) && !src.includes("image.tmdb.org");
}

function splitTitle(title: string) {
  const words = title.trim().split(/\s+/);

  if (words.length < 2) {
    return { leading: "", accent: title };
  }

  return {
    leading: words.slice(0, -1).join(" "),
    accent: words[words.length - 1],
  };
}

function HeroButton({
  href,
  label,
  icon: Icon,
  primary = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
}) {
  const external = isExternalLink(href);

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={
        primary
          ? "inline-flex h-[68px] items-center gap-4 rounded-[18px] bg-[var(--color-accent)] px-10 font-[family-name:var(--font-heading)] text-[1.05rem] font-semibold text-[var(--color-accent-contrast)] transition hover:brightness-105"
          : "inline-flex h-[68px] items-center gap-4 rounded-[18px] border border-[var(--color-border)] bg-[rgba(15,19,34,0.42)] px-10 font-[family-name:var(--font-heading)] text-[1.05rem] font-semibold text-[var(--color-accent)] transition hover:border-[rgba(194,154,98,0.32)] hover:bg-[rgba(255,255,255,0.03)]"
      }
    >
      <Icon className={primary ? "h-5 w-5 fill-current" : "h-5 w-5"} />
      <span>{label}</span>
    </Link>
  );
}

function MetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[120px]">
      <p className="font-[family-name:var(--font-heading)] text-[0.88rem] uppercase tracking-[0.16em] text-[var(--color-accent)]">
        {label}
      </p>
      <p className="mt-2 text-[1.05rem] text-[var(--color-text)]">{value}</p>
    </div>
  );
}

export function HomeLandingHero({
  item,
  overview,
  genreLabel,
  rating,
}: HomeLandingHeroProps) {
  const heroImage = item.imageUrl || getBackdropUrl(item.backdropPath ?? null, "original");
  const { leading, accent } = splitTitle(item.title);
  const ratingOutOfFive = Math.max(0, Math.min(5, rating / 2));
  const activeStars = Math.max(0, Math.min(5, Math.round(ratingOutOfFive)));

  return (
    <section className="relative min-h-[calc(100svh-84px)] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt={item.title}
          fill
          priority
          sizes="(min-width: 1280px) calc(100vw - 304px), 100vw"
          quality={95}
          className="object-cover object-center"
          unoptimized={shouldUseUnoptimizedImage(heroImage)}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(22,26,39,0.96)_0%,rgba(22,26,39,0.88)_28%,rgba(22,26,39,0.42)_56%,rgba(22,26,39,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,30,46,0.18)_0%,rgba(26,30,46,0.1)_36%,rgba(26,30,46,0.94)_100%)]" />
      </div>

      <div className="relative flex min-h-[calc(100svh-84px)] items-center px-5 py-16 md:px-8 xl:px-14">
        <div className="w-full max-w-[930px]">
          <div className="flex flex-wrap items-center gap-5">
            <span className="rounded-full border border-[rgba(194,154,98,0.3)] bg-[rgba(194,154,98,0.12)] px-4 py-2 font-[family-name:var(--font-heading)] text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              Feature Selection
            </span>

            <div className="flex items-center gap-1 text-[var(--color-accent)]">
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  className={index < activeStars ? "h-4 w-4 fill-current" : "h-4 w-4 text-[rgba(194,154,98,0.32)]"}
                />
              ))}
              <span className="ml-3 text-[1.05rem] font-semibold text-[var(--color-text)]">
                {ratingOutOfFive.toFixed(1)} / 5.0
              </span>
            </div>
          </div>

          <h1 className="mt-10 font-[family-name:var(--font-heading)] text-[clamp(3.5rem,7.8vw,7rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.06em] text-[#e8ebff]">
            {leading ? (
              <>
                {leading} <span className="text-[var(--color-accent)]">{accent}</span>
              </>
            ) : (
              <span className="text-[var(--color-accent)]">{accent}</span>
            )}
          </h1>

          <div className="mt-10 flex flex-wrap items-start gap-10">
            <MetaItem label="Release Date" value={item.releaseLabel} />
            <MetaItem label="Genres" value={genreLabel} />
            <MetaItem label="Director" value={item.director} />
          </div>

          <p className="mt-10 max-w-[880px] text-[1.08rem] leading-10 text-[#d8ddee] md:text-[1.12rem]">
            {overview}
          </p>

          <div className="mt-12 flex flex-wrap gap-4">
            <HeroButton href={item.trailerHref} label="Trailers" icon={Play} primary />
            <HeroButton href="/features" label="Audio" icon={Music4} />
            <HeroButton href="/photos" label="Images" icon={ImageIcon} />
          </div>
        </div>
      </div>
    </section>
  );
}

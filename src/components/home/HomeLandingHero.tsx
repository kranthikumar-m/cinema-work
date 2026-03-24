"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  type LucideIcon,
  Music4,
  Play,
  Star,
} from "lucide-react";
import { getBackdropUrl } from "@/lib/utils";
import type { HomepageHeroSlide } from "@/types/homepage";

interface HomeLandingHeroProps {
  slides: HomepageHeroSlide[];
  scrollTargetId?: string;
}

const AUTOPLAY_DELAY_MS = 10_000;

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

function resolveHeroImage(slide: HomepageHeroSlide) {
  return slide.item.imageUrl || getBackdropUrl(slide.item.backdropPath ?? null, "original");
}

export function HomeLandingHero({
  slides,
  scrollTargetId = "home-content",
}: HomeLandingHeroProps) {
  const heroSlides = useMemo(
    () => slides.filter((slide) => slide.item.title),
    [slides]
  );
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!heroSlides.length) return;
    if (current >= heroSlides.length) {
      setCurrent(0);
    }
  }, [current, heroSlides.length]);

  const next = useCallback(() => {
    if (heroSlides.length < 2) return;
    setCurrent((value) => (value + 1) % heroSlides.length);
  }, [heroSlides.length]);

  const previous = useCallback(() => {
    if (heroSlides.length < 2) return;
    setCurrent((value) => (value - 1 + heroSlides.length) % heroSlides.length);
  }, [heroSlides.length]);

  const scrollToContent = useCallback(() => {
    const target = document.getElementById(scrollTargetId);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [scrollTargetId]);

  useEffect(() => {
    if (heroSlides.length < 2) return;

    const timer = setInterval(() => {
      next();
    }, AUTOPLAY_DELAY_MS);

    return () => clearInterval(timer);
  }, [current, heroSlides.length, next]);

  if (!heroSlides.length) {
    return null;
  }

  const slide = heroSlides[current];
  const heroImage = resolveHeroImage(slide);
  const { leading, accent } = splitTitle(slide.item.title);
  const ratingOutOfFive = Math.max(0, Math.min(5, slide.rating / 2));
  const activeStars = Math.max(0, Math.min(5, Math.round(ratingOutOfFive)));

  return (
    <section className="relative min-h-[calc(100svh+80px)] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={String(slide.item.id)}
          className="absolute inset-0"
          initial={{ opacity: 0.45, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.18, scale: 0.99 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={heroImage}
            alt={slide.item.title}
            fill
            priority={current === 0}
            sizes="(min-width: 1280px) calc(100vw - 208px), 100vw"
            quality={95}
            className="object-cover object-center"
            unoptimized={shouldUseUnoptimizedImage(heroImage)}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(22,26,39,0.96)_0%,rgba(22,26,39,0.88)_28%,rgba(22,26,39,0.42)_56%,rgba(22,26,39,0.18)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,30,46,0.18)_0%,rgba(26,30,46,0.1)_36%,rgba(26,30,46,0.94)_100%)]" />
        </motion.div>
      </AnimatePresence>

      {heroSlides.length > 1 ? (
        <div className="absolute right-5 top-1/2 z-20 flex -translate-y-1/2 items-center gap-4 md:right-8 xl:right-14">
          <button
            type="button"
            onClick={previous}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[rgba(20,24,39,0.5)] text-[var(--color-text)] backdrop-blur-sm transition hover:border-[rgba(194,154,98,0.32)] hover:text-[var(--color-accent)]"
            aria-label="Previous featured release"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-[74px] text-center font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.14em] text-[var(--color-text)]">
            <span className="text-[var(--color-accent)]">{String(current + 1).padStart(2, "0")}</span>
            <span className="mx-2 text-[var(--color-muted)]">/</span>
            <span className="text-[var(--color-muted-strong)]">{String(heroSlides.length).padStart(2, "0")}</span>
          </div>

          <button
            type="button"
            onClick={next}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[rgba(20,24,39,0.5)] text-[var(--color-text)] backdrop-blur-sm transition hover:border-[rgba(194,154,98,0.32)] hover:text-[var(--color-accent)]"
            aria-label="Next featured release"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-[79px] z-20 flex justify-center px-5 md:bottom-[87px] md:px-8 xl:px-14">
        <button
          type="button"
          onClick={scrollToContent}
          aria-label="Scroll to content"
          aria-controls={scrollTargetId}
          className="pointer-events-auto group relative flex h-[38px] w-[24px] items-start justify-center rounded-full border border-[rgba(194,154,98,0.26)] bg-[rgba(11,14,24,0.42)] shadow-[0_18px_40px_rgba(6,8,16,0.18)] backdrop-blur-sm transition hover:border-[rgba(194,154,98,0.42)] hover:bg-[rgba(14,18,31,0.62)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(194,154,98,0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(11,14,24,0.95)]"
        >
          <motion.span
            aria-hidden="true"
            className="mt-2.5 h-2 w-[2px] rounded-full bg-[var(--color-accent)]"
            animate={{ y: [0, 9, 0], opacity: [0.15, 1, 0.15] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="sr-only">Skip hero and scroll to content</span>
        </button>
      </div>

      <div className="relative flex min-h-[calc(100svh+80px)] items-center px-5 py-16 md:px-8 xl:px-14">
        <div className="relative w-full max-w-[930px] translate-y-[100px]">
          <motion.div
            key={`${slide.item.id}-content`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex min-h-[620px] w-full flex-col"
          >
            <div className="translate-y-[55px]">
              <div className="flex flex-wrap items-center gap-5">
                <span className="rounded-full border border-[rgba(194,154,98,0.3)] bg-[rgba(194,154,98,0.12)] px-4 py-2 font-[family-name:var(--font-heading)] text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                  Latest Telugu Release
                </span>

                <div className="flex items-center gap-1 text-[var(--color-accent)]">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className={
                        index < activeStars
                          ? "h-4 w-4 fill-current"
                          : "h-4 w-4 text-[rgba(194,154,98,0.32)]"
                      }
                    />
                  ))}
                  <span className="ml-3 text-[1.05rem] font-semibold text-[var(--color-text)]">
                    {ratingOutOfFive.toFixed(1)} / 5.0
                  </span>
                </div>
              </div>

              <h1 className="mt-10 w-full overflow-hidden text-ellipsis whitespace-nowrap font-[family-name:var(--font-heading)] text-[clamp(2.4rem,5.2vw,4.8rem)] font-extrabold uppercase leading-[0.96] tracking-[-0.05em] text-[#e8ebff]">
                {leading ? (
                  <>
                    {leading} <span className="text-[var(--color-accent)]">{accent}</span>
                  </>
                ) : (
                  <span className="text-[var(--color-accent)]">{accent}</span>
                )}
              </h1>

              <div className="mt-10 flex flex-wrap items-start gap-10">
                <MetaItem label="Release Date" value={slide.item.releaseLabel} />
                <MetaItem label="Genres" value={slide.genreLabel} />
                <MetaItem label="Director" value={slide.item.director} />
              </div>

              <p className="mt-10 max-h-[120px] max-w-[880px] overflow-hidden text-[1.08rem] leading-10 text-[#d8ddee] md:text-[1.12rem]">
                {slide.overview}
              </p>
            </div>

            <div className="mt-auto flex flex-wrap gap-4 pt-0 -translate-y-[40px]">
              <HeroButton href={slide.item.trailerHref} label="Trailers" icon={Play} primary />
              <HeroButton href="/features" label="Audio" icon={Music4} />
              <HeroButton href="/photos" label="Images" icon={ImageIcon} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

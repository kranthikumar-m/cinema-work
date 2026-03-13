"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Play } from "lucide-react";
import { getBackdropUrl } from "@/lib/utils";
import type { HomepageHeroItem } from "@/types/homepage";
import { HomeTopOverlayControls } from "@/components/home/HomeTopOverlayControls";
import { HomeHeroActions } from "@/components/home/HomeHeroActions";
import { HomeHeroMeta } from "@/components/home/HomeHeroMeta";
import { HomeCarouselControls } from "@/components/home/HomeCarouselControls";

interface HomeHeroBannerProps {
  items: HomepageHeroItem[];
}

function resolveImageSource(item: HomepageHeroItem) {
  if (item.imageUrl) return item.imageUrl;
  return getBackdropUrl(item.backdropPath ?? null, "original");
}

export function HomeHeroBanner({ items }: HomeHeroBannerProps) {
  const slides = useMemo(() => items.filter((item) => item.title), [items]);
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((value) => (value + 1) % slides.length);
  }, [slides.length]);

  const previous = useCallback(() => {
    setCurrent((value) => (value - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;

    const timer = setInterval(() => {
      setCurrent((value) => (value + 1) % slides.length);
    }, 8500);

    return () => clearInterval(timer);
  }, [slides.length, current]);

  if (!slides.length) return null;

  const item = slides[current];

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#080706]">
      <AnimatePresence mode="wait">
        <motion.div
          key={String(item.id)}
          className="absolute inset-0"
          initial={{ opacity: 0.4, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.2, scale: 0.985 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={resolveImageSource(item)}
            alt={item.title}
            fill
            priority={current === 0}
            sizes="100vw"
            className="object-cover object-[62%_center]"
            unoptimized={!item.backdropPath && !item.imageUrl}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.82)_18%,rgba(0,0,0,0.48)_44%,rgba(0,0,0,0.18)_72%,rgba(0,0,0,0.36)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.14)_0%,rgba(0,0,0,0)_22%,rgba(0,0,0,0.24)_56%,rgba(0,0,0,0.92)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_56%_10%,rgba(255,214,128,0.56)_0%,rgba(173,92,42,0.25)_28%,rgba(0,0,0,0)_58%),linear-gradient(90deg,rgba(66,31,12,0.46)_0%,rgba(0,0,0,0)_48%,rgba(87,42,16,0.46)_100%)]" />
        </motion.div>
      </AnimatePresence>

      <HomeTopOverlayControls />
      <HomeCarouselControls
        current={current + 1}
        total={slides.length}
        onPrevious={previous}
        onNext={next}
      />

      <div className="relative flex min-h-screen items-end px-5 pb-24 pt-24 md:px-9 md:pb-24 xl:px-14 xl:pb-28">
        <motion.div
          key={`${item.id}-content`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-[760px]"
        >
          <div className="mb-4 flex items-center gap-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/65 bg-black/12">
              <Play className="h-4 w-4 fill-current" />
            </span>
            <span className="text-lg tracking-[0.06em] text-white/96 md:text-[1.7rem] md:leading-none">
              {item.trailerLabel}
            </span>
          </div>

          <h1 className="max-w-[11ch] text-[2.7rem] font-light leading-[0.96] tracking-[-0.04em] text-white md:max-w-[12ch] md:text-[3.5rem] xl:text-[4.35rem]">
            {item.title}
          </h1>

          <p className="mt-4 text-base text-white/92 md:text-[1.15rem]">
            {item.runtimeLabel}
            <span className="mx-2 text-white/50">|</span>
            {item.viewsLabel}
          </p>

          <div className="mt-8">
            <HomeHeroActions item={item} />
          </div>

          <div className="mt-10 h-px w-full bg-white/28" />

          <div className="mt-8 max-w-[860px]">
            <HomeHeroMeta item={item} />
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
        <Link
          href="#home-content"
          className="pointer-events-auto flex h-14 w-8 items-start justify-center rounded-full border border-white/70 p-1.5 text-white/85"
          aria-label="Scroll to homepage content"
        >
          <span className="scroll-cue-dot h-3.5 w-3.5 rounded-full bg-white" />
        </Link>
      </div>
    </section>
  );
}


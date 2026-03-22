"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface HomeCarouselControlsProps {
  current: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function HomeCarouselControls({
  current,
  total,
  onPrevious,
  onNext,
}: HomeCarouselControlsProps) {
  return (
    <div className="absolute bottom-10 right-5 z-30 flex items-center gap-3 text-white md:bottom-auto md:right-8 md:top-1/2 md:-translate-y-1/2 xl:right-10">
      <button
        type="button"
        onClick={onPrevious}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-black/10 text-white/90 backdrop-blur-sm transition hover:border-white/55 hover:bg-black/18 md:h-14 md:w-14"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
      </button>

      <div className="min-w-[84px] text-center font-light tracking-[0.06em]">
        <span className="text-4xl md:text-5xl">{current}</span>
        <span className="mx-1 text-white/60">/</span>
        <span className="text-xl text-white/72 md:text-2xl">{total}</span>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-black/10 text-white/90 backdrop-blur-sm transition hover:border-white/55 hover:bg-black/18 md:h-14 md:w-14"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
      </button>
    </div>
  );
}


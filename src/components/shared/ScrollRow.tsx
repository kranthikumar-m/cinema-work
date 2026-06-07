"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Horizontal scroll row with left/right nav arrows (like the photo popup arrows).
 * Each arrow only shows when there's more to scroll in that direction, and a
 * click advances ~one viewport so you can page through to the end of the list.
 */
export function ScrollRow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  function scrollByDirection(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  const arrowClass =
    "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/80";

  return (
    <div className="relative">
      <div ref={ref} onScroll={update} className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {children}
      </div>

      {edges.left && (
        <button
          type="button"
          onClick={() => scrollByDirection(-1)}
          aria-label="Scroll left"
          className={`${arrowClass} left-1`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {edges.right && (
        <button
          type="button"
          onClick={() => scrollByDirection(1)}
          aria-label="Scroll right"
          className={`${arrowClass} right-1`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

"use client";

import { Search, User } from "lucide-react";
import { SearchOverlayLauncher } from "@/components/layout/SearchOverlayLauncher";

export function HomeTopOverlayControls() {
  return (
    <div className="absolute right-4 top-5 z-30 flex items-center gap-3 md:right-8 md:top-7 xl:right-10">
      <SearchOverlayLauncher>
        {(openSearch) => (
          <button
            type="button"
            onClick={openSearch}
            className="flex items-center gap-2 text-sm font-medium text-white/92 transition hover:text-white md:text-base"
            aria-label="Open search"
          >
            <span className="hidden sm:inline">Start Typing</span>
            <Search className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        )}
      </SearchOverlayLauncher>

      <button
        type="button"
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-black/10 text-white/92 backdrop-blur-[10px] transition hover:border-white/20 hover:bg-black/20 md:h-14 md:w-14"
        aria-label="Profile"
      >
        <User className="h-5 w-5 md:h-6 md:w-6" />
      </button>
    </div>
  );
}

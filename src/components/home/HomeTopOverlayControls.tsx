"use client";

import { Search } from "lucide-react";
import { SearchOverlayLauncher } from "@/components/layout/SearchOverlayLauncher";
import { AccountMenu } from "@/components/layout/AccountMenu";

export function HomeTopOverlayControls() {
  return (
    <div className="absolute right-4 top-4 z-30 flex items-center gap-4 md:right-8 md:top-5 xl:right-10">
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
      <AccountMenu variant="overlay" />
    </div>
  );
}

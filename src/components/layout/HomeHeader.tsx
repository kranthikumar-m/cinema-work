"use client";

import { Search } from "lucide-react";
import { SearchOverlayLauncher } from "@/components/layout/SearchOverlayLauncher";

export function HomeHeader() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div className="flex h-[84px] items-center justify-end px-5 md:px-8 xl:px-14">
        <SearchOverlayLauncher>
          {(openSearch) => (
            <button
              type="button"
              onClick={openSearch}
              className="pointer-events-auto inline-flex items-center gap-3 text-sm font-medium text-[var(--color-text)] transition hover:text-[var(--color-accent-strong)] md:text-base"
              aria-label="Open search"
            >
              <span>Start Typing</span>
              <Search className="h-4 w-4 text-[var(--color-accent)] md:h-5 md:w-5" />
            </button>
          )}
        </SearchOverlayLauncher>
      </div>
    </header>
  );
}

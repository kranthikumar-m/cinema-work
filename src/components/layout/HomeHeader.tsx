"use client";

import { Search } from "lucide-react";
import { SearchOverlayLauncher } from "@/components/layout/SearchOverlayLauncher";
import { AccountMenu } from "@/components/layout/AccountMenu";

/** Transparent header over the homepage hero: search launcher + account menu. */
export function HomeHeader() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div className="flex h-[64px] items-center justify-end gap-4 px-[var(--app-page-gutter)]">
        <SearchOverlayLauncher>
          {(openSearch) => (
            <button
              type="button"
              onClick={openSearch}
              className="pointer-events-auto inline-flex items-center gap-3 text-sm font-medium text-white/92 transition hover:text-white md:text-base"
              aria-label="Open search"
            >
              <span className="hidden sm:inline">Start Typing</span>
              <Search className="h-4 w-4 text-[var(--color-accent)] md:h-5 md:w-5" />
            </button>
          )}
        </SearchOverlayLauncher>
        <div className="pointer-events-auto">
          <AccountMenu variant="overlay" />
        </div>
      </div>
    </header>
  );
}

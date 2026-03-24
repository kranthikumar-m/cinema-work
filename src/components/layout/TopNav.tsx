"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { SearchOverlayLauncher } from "@/components/layout/SearchOverlayLauncher";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { TopNavAccountControls } from "@/components/layout/TopNavAccountControls";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[rgba(28,33,51,0.92)] backdrop-blur-xl">
      <div className="flex h-[84px] items-center justify-between px-[var(--app-page-gutter)]">
        <div className="flex items-center">
          <Link href="/" className="ml-14 block lg:hidden">
            <SiteLogo variant="nav" priority />
          </Link>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <SearchOverlayLauncher>
            {(openSearch) => (
              <button
                type="button"
                onClick={openSearch}
                className="flex h-11 items-center gap-3 rounded-md border border-[var(--color-border)] bg-[rgba(20,24,39,0.82)] px-4 text-sm text-[var(--color-muted)] transition hover:border-[rgba(194,154,98,0.32)] hover:text-[var(--color-text)] md:w-[300px]"
                aria-label="Search archives"
              >
                <span className="truncate">Search archives...</span>
                <Search className="ml-auto h-4 w-4 shrink-0 text-[var(--color-accent)]" />
              </button>
            )}
          </SearchOverlayLauncher>
          <TopNavAccountControls />
        </div>
      </div>
    </header>
  );
}

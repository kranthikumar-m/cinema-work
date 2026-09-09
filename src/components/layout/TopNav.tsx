"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { SearchOverlayLauncher } from "@/components/layout/SearchOverlayLauncher";
import { AccountMenu } from "@/components/layout/AccountMenu";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[rgba(28,33,51,0.92)] backdrop-blur-xl">
      <div className="flex h-[64px] items-center justify-between px-[var(--app-page-gutter)]">
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
                className="inline-flex items-center gap-3 text-sm font-medium text-[var(--color-text)] transition hover:text-[var(--color-accent-strong)]"
                aria-label="Open search"
              >
                <span className="hidden sm:inline">Start Typing</span>
                <Search className="h-4 w-4 text-[var(--color-accent)]" />
              </button>
            )}
          </SearchOverlayLauncher>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
